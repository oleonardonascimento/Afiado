"use client";

/** Itens da comanda: busca rápida de serviço/produto, quantidade, desconto por item, remover. */
import { Crown, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderItem, Product, Service } from "@/domain/entities";
import { itemTotalCents } from "@/domain/commission";
import { formatBRL } from "@/lib/format";

const MAX_RESULTS = 8;

type OrderItemsProps = {
  items: OrderItem[];
  services: Service[];
  products: Product[];
  professionalId: string;
  readOnly: boolean;
  onChange: (items: OrderItem[]) => void;
};

export function OrderItems({ items, services, products, professionalId, readOnly, onChange }: OrderItemsProps) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const results = term
    ? [
        ...services
          .filter((s) => s.active && s.name.toLowerCase().includes(term))
          .map((s) => ({ kind: "service" as const, id: s.id, name: s.name, priceCents: s.priceCents, stock: null })),
        ...products
          .filter((p) => p.active && p.name.toLowerCase().includes(term))
          .map((p) => ({ kind: "product" as const, id: p.id, name: p.name, priceCents: p.priceCents, stock: p.stock })),
      ].slice(0, MAX_RESULTS)
    : [];

  const patch = (id: string, change: Partial<OrderItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...change } : i)));

  return (
    <section aria-labelledby="items-title" className="flex flex-col gap-3">
      <h2 id="items-title" className="text-lg font-semibold">
        Itens
      </h2>
      {items.length === 0 && <p className="text-text-muted">Nenhum item ainda. Busque um serviço ou produto abaixo.</p>}
      <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block font-medium">{item.name}</span>
                <span className="text-sm text-text-muted">
                  {item.kind === "service" ? "Serviço" : "Produto"} · {formatBRL(item.unitPriceCents)} cada
                </span>
              </span>
              <span className="flex flex-col items-end">
                {item.clubCovered ? (
                  <>
                    <span className="text-sm text-text-muted line-through tabular-nums">
                      {formatBRL(item.unitPriceCents * item.quantity)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-club-fg">
                      <Crown className="size-3.5" strokeWidth={1.75} aria-hidden />
                      Clube
                    </span>
                  </>
                ) : (
                  <span className="font-medium tabular-nums">{formatBRL(itemTotalCents(item))}</span>
                )}
              </span>
            </div>
            {!readOnly && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1" role="group" aria-label={`Quantidade de ${item.name}`}>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Diminuir quantidade"
                    disabled={item.quantity <= 1}
                    onClick={() => patch(item.id, { quantity: item.quantity - 1 })}
                  >
                    <Minus strokeWidth={1.75} aria-hidden />
                  </Button>
                  <span className="w-8 text-center tabular-nums" aria-live="polite">
                    {item.quantity}
                  </span>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Aumentar quantidade"
                    disabled={item.clubCovered}
                    onClick={() => patch(item.id, { quantity: item.quantity + 1 })}
                  >
                    <Plus strokeWidth={1.75} aria-hidden />
                  </Button>
                </div>
                {!item.clubCovered && (
                  <MoneyInput
                    aria-label={`Desconto em ${item.name}`}
                    placeholder="Desconto"
                    className="w-36"
                    value={item.discountCents || null}
                    onChange={(cents) => patch(item.id, { discountCents: cents ?? 0 })}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                >
                  <Trash2 strokeWidth={1.75} aria-hidden />
                  Remover
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" strokeWidth={1.75} aria-hidden />
            <Input
              aria-label="Adicionar serviço ou produto"
              placeholder="Adicionar serviço ou produto"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {term && results.length === 0 && <p className="text-sm text-text-muted">Nada encontrado com esse nome.</p>}
          {results.length > 0 && (
            <ul className="divide-y divide-border rounded-control border border-border">
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left hover:bg-surface-2"
                    onClick={() => {
                      onChange([
                        ...items,
                        {
                          id: crypto.randomUUID(),
                          kind: r.kind,
                          refId: r.id,
                          name: r.name,
                          quantity: 1,
                          unitPriceCents: r.priceCents,
                          discountCents: 0,
                          clubCovered: false,
                          professionalId,
                        },
                      ]);
                      setQuery("");
                    }}
                  >
                    <span>
                      {r.name}
                      <span className="block text-sm text-text-muted">
                        {r.kind === "service" ? "Serviço" : `Produto · ${r.stock} em estoque`}
                      </span>
                    </span>
                    <span className="tabular-nums">{formatBRL(r.priceCents)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

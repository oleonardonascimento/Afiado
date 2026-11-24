"use client";

/** A11: produtos — estoque com alerta de baixo, cadastro e ajuste de estoque. */
import {
  AlertTriangle,
  Package,
  PackagePlus,
  Pencil,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/domain/entities";
import { lowStock } from "@/domain/metrics";
import { marginPct } from "@/domain/product";
import { useProducts } from "@/features/catalog/hooks/useCatalog";
import { ProductFormDialog } from "@/features/products/components/ProductFormDialog";
import { StockAdjustDialog } from "@/features/products/components/StockAdjustDialog";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";

export function ProductsAdmin() {
  const products = useProducts();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  if (products.isError)
    return <ErrorState onRetry={() => void products.refetch()} />;
  const list = [...(products.data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
  const low = new Set(lowStock(list).map((p) => p.id));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Produtos"
        description="Vendidos no balcão e lançados na comanda."
      >
        <Button onClick={() => setEditing("new")}>
          <Plus strokeWidth={1.75} aria-hidden />
          Novo produto
        </Button>
      </PageHeader>

      {products.isLoading ? (
        <Skeleton className="rounded-card h-64" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Cadastre pomadas, óleos e o que mais vender no balcão para lançar na comanda."
        />
      ) : (
        <>
          {low.size > 0 && (
            <p
              role="status"
              className="rounded-control border-warning flex items-center gap-2 border px-3 py-2 text-sm"
            >
              <AlertTriangle
                className="text-warning size-4 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              {low.size === 1 ? "1 produto está" : `${low.size} produtos estão`}{" "}
              com estoque baixo.
            </p>
          )}
          <ul className="divide-border rounded-card border-border bg-surface divide-y border">
            {list.map((p) => {
              const margin = marginPct(p);
              const isLow = low.has(p.id);
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 px-4 py-3",
                    !p.active && "opacity-70",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium" title={p.name}>
                      {p.name}
                      {!p.active && (
                        <span className="text-text-muted ml-2 text-sm font-normal">
                          inativo
                        </span>
                      )}
                    </span>
                    <span className="text-text-muted block text-sm tabular-nums">
                      {formatBRL(p.priceCents)} · custo {formatBRL(p.costCents)}
                      {margin !== null && <> · margem {margin}%</>} · comissão{" "}
                      {p.commissionPct}%
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-sm tabular-nums",
                      isLow && "font-medium",
                    )}
                  >
                    {isLow && (
                      <AlertTriangle
                        className="text-warning size-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    )}
                    {p.stock} em estoque
                    {isLow && (
                      <span className="sr-only">
                        , abaixo do mínimo de {p.minStock}
                      </span>
                    )}
                  </span>
                  <span className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ajustar estoque de ${p.name}`}
                      onClick={() => setAdjusting(p)}
                    >
                      <PackagePlus strokeWidth={1.75} aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${p.name}`}
                      onClick={() => setEditing(p)}
                    >
                      <Pencil strokeWidth={1.75} aria-hidden />
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {editing && (
        <ProductFormDialog
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {adjusting && (
        <StockAdjustDialog
          product={adjusting}
          onClose={() => setAdjusting(null)}
        />
      )}
    </div>
  );
}

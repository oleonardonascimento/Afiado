"use client";

/** A4: comandas — abas Abertas / Fechadas hoje / Todas, busca por cliente e comanda avulsa. */
import { Plus, Receipt, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order } from "@/domain/entities";
import { orderTotals } from "@/domain/order";
import { useProfessionals } from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { WalkInDialog } from "@/features/orders/components/WalkInDialog";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { useStaffMember } from "@/hooks/useSession";
import { dateOf, todayIn } from "@/lib/calendar";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { firstName } from "@/lib/labels";

type Tab = "open" | "today" | "all";
const PAGE = 50;

export function OrdersList() {
  const orders = useOrders();
  const clients = useClients();
  const professionals = useProfessionals();
  const { role, staff } = useStaffMember();
  const [tab, setTab] = useState<Tab>("open");
  const [query, setQuery] = useState("");
  const [walkIn, setWalkIn] = useState(false);
  const today = todayIn(new Date());

  const clientName = (o: Order) => clients.data?.find((c) => c.id === o.clientId)?.name ?? "Sem cadastro";
  const term = query.trim().toLowerCase();
  const list = (orders.data ?? [])
    .filter((o) => role !== "barber" || o.professionalId === staff?.id)
    .filter((o) =>
      tab === "open"
        ? o.status === "open"
        : tab === "today"
          ? o.status === "closed" && o.closedAt !== null && dateOf(o.closedAt) === today
          : true,
    )
    .filter((o) => !term || clientName(o).toLowerCase().includes(term))
    .sort((a, b) => (b.closedAt ?? b.openedAt).localeCompare(a.closedAt ?? a.openedAt));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageHeader title="Comandas">
        <Button onClick={() => setWalkIn(true)}>
          <Plus strokeWidth={1.75} aria-hidden />
          Nova comanda
        </Button>
      </PageHeader>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="open">Abertas</TabsTrigger>
            <TabsTrigger value="today">Fechadas hoje</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" strokeWidth={1.75} aria-hidden />
          <Input
            aria-label="Buscar por cliente"
            placeholder="Buscar por cliente"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {orders.isError ? (
        <ErrorState onRetry={() => void orders.refetch()} />
      ) : orders.isLoading || clients.isLoading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={tab === "open" ? "Nenhuma comanda aberta" : "Nenhuma comanda aqui"}
          description={
            tab === "open"
              ? "Ao concluir um atendimento na agenda, a comanda abre sozinha. Para venda sem agendamento, crie uma comanda avulsa."
              : "Tente outra aba ou limpe a busca."
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-card border border-border bg-surface">
          {list.slice(0, PAGE).map((o) => {
            const t = orderTotals(o);
            const when = o.closedAt ?? o.openedAt;
            return (
              <li key={o.id}>
                <Link
                  href={`/admin/comandas/${o.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{clientName(o)}</span>
                    <span className="text-sm text-text-muted">
                      {formatDate(when, "dd/MM")} {formatTime(when)} ·{" "}
                      {firstName(professionals.data?.find((p) => p.id === o.professionalId)?.name ?? "")} ·{" "}
                      {o.items.length} {o.items.length === 1 ? "item" : "itens"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-medium tabular-nums">{formatBRL(t.totalCents)}</span>
                    <span className="text-sm text-text-muted">
                      {o.status === "open" ? "Aberta" : o.status === "closed" ? "Fechada" : "Cancelada"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > PAGE && (
        <p className="text-sm text-text-muted">Mostrando as {PAGE} mais recentes. Use a busca para achar outras.</p>
      )}
      {walkIn && <WalkInDialog onClose={() => setWalkIn(false)} />}
    </div>
  );
}

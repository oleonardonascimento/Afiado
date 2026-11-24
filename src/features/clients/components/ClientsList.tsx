"use client";

/** A7: clientes — busca e filtros (assinante, sumido, aniversariante, origem) com colunas de resumo. */
import { Crown, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientSourceSchema } from "@/domain/entities";
import { clientStats } from "@/domain/metrics";
import { isSubscriptionActive } from "@/domain/subscription";
import { useAllAppointments } from "@/features/agenda/hooks/useAgenda";
import { usePlans } from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { useSubscriptions } from "@/features/club/hooks/useClubAdmin";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { diffDays, middayIso, todayIn } from "@/lib/calendar";
import { formatBRL, formatDate, formatPhone } from "@/lib/format";
import { CLIENT_SOURCE_LABEL } from "@/lib/labels";

const PAGE = 60;
type Filter = "all" | "club" | "away30" | "away60" | "away90" | "birthday";
const FILTERS: Record<Filter, string> = {
  all: "Todos",
  club: "Assinantes do Clube",
  away30: "Sumidos há +30 dias",
  away60: "Sumidos há +60 dias",
  away90: "Sumidos há +90 dias",
  birthday: "Aniversariantes do mês",
};

export function ClientsList() {
  const clients = useClients();
  const appointments = useAllAppointments();
  const orders = useOrders();
  const subscriptions = useSubscriptions();
  const plans = usePlans();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [source, setSource] = useState("all");

  if (clients.isError || appointments.isError)
    return <ErrorState onRetry={() => void clients.refetch()} />;
  if (
    clients.isLoading ||
    appointments.isLoading ||
    orders.isLoading ||
    subscriptions.isLoading
  ) {
    return <Skeleton className="rounded-card mx-auto h-96 max-w-6xl" />;
  }

  const today = todayIn(new Date());
  const now = new Date();
  const stats = clientStats(appointments.data ?? [], orders.data ?? []);
  const planOf = new Map(
    (subscriptions.data ?? [])
      .filter((s) => isSubscriptionActive(s, now))
      .map((s) => [
        s.clientId,
        plans.data?.find((p) => p.id === s.planId)?.name ?? "Clube",
      ]),
  );
  const term = query.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const awayDays = { away30: 30, away60: 60, away90: 90 } as const;

  const list = (clients.data ?? [])
    .filter(
      (c) =>
        !term ||
        c.name.toLowerCase().includes(term) ||
        (digits.length >= 3 && c.phone.includes(digits)),
    )
    .filter((c) => source === "all" || (c.source ?? "none") === source)
    .filter((c) => {
      if (filter === "club") return planOf.has(c.id);
      if (filter === "birthday")
        return c.birthday?.slice(5, 7) === today.slice(5, 7);
      if (filter in awayDays) {
        const last = stats.get(c.id)?.lastVisit;
        return (
          last !== null &&
          last !== undefined &&
          diffDays(today, last) > awayDays[filter as keyof typeof awayDays]
        );
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PageHeader
        title="Clientes"
        description={`${clients.data?.length ?? 0} clientes cadastrados`}
      />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="text-text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            strokeWidth={1.75}
            aria-hidden
          />
          <Input
            aria-label="Buscar por nome ou celular"
            placeholder="Buscar por nome ou celular"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-56" aria-label="Filtro">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FILTERS) as Filter[]).map((f) => (
              <SelectItem key={f} value={f}>
                {FILTERS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-48" aria-label="Origem">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {ClientSourceSchema.options.map((s) => (
              <SelectItem key={s} value={s}>
                {CLIENT_SOURCE_LABEL[s]}
              </SelectItem>
            ))}
            <SelectItem value="none">Não informada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Mude a busca ou os filtros."
        />
      ) : (
        <div className="rounded-card border-border bg-surface overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="text-text-muted text-left">
              <tr className="border-border border-b">
                <th className="px-4 py-2 font-normal">Nome</th>
                <th className="px-4 py-2 font-normal">Celular</th>
                <th className="px-4 py-2 font-normal">Última visita</th>
                <th className="px-4 py-2 text-right font-normal">Visitas</th>
                <th className="px-4 py-2 text-right font-normal">
                  Total gasto
                </th>
                <th className="px-4 py-2 font-normal">Plano</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, PAGE).map((c) => {
                const s = stats.get(c.id);
                const plan = planOf.get(c.id);
                return (
                  <tr
                    key={c.id}
                    className="border-border hover:bg-surface-2 border-b last:border-0"
                  >
                    <td className="max-w-56 px-4 py-2">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="block truncate font-medium hover:underline"
                        title={c.name}
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                      {formatPhone(c.phone)}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {s?.lastVisit
                        ? formatDate(middayIso(s.lastVisit), "dd/MM/yy")
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {s?.visits ?? 0}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatBRL(s?.spentCents ?? 0)}
                    </td>
                    <td className="px-4 py-2">
                      {plan ? (
                        <span className="inline-flex items-center gap-1">
                          <Crown
                            className="text-club-fg size-3.5"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {plan}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {list.length > PAGE && (
        <p className="text-text-muted text-sm">
          Mostrando {PAGE} de {list.length}. Use a busca ou os filtros para
          achar outros.
        </p>
      )}
    </div>
  );
}

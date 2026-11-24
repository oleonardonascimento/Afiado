"use client";

/** A9: Clube no painel — indicadores, planos (CRUD) e assinantes com filtro de status. */
import { Crown, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionStatusSchema, type Plan } from "@/domain/entities";
import { clubIndicators } from "@/domain/metrics";
import { planUsage } from "@/domain/subscription";
import { usePlans, useServices } from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { PlanFormDialog } from "@/features/club/components/PlanFormDialog";
import { useSubscriptions } from "@/features/club/hooks/useClubAdmin";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { atTime, todayIn } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatBRL, formatDate } from "@/lib/format";
import { SUBSCRIPTION_STATUS_SHORT, benefitLabel } from "@/lib/labels";

const ALL = "todos";

export function ClubAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const plans = usePlans();
  const services = useServices();
  const subscriptions = useSubscriptions();
  const clients = useClients();
  const orders = useOrders();
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const statusParam = SubscriptionStatusSchema.safeParse(search.get("status"));
  const status = statusParam.success ? statusParam.data : ALL;

  if (plans.isError || subscriptions.isError)
    return <ErrorState onRetry={() => void subscriptions.refetch()} />;
  if (
    plans.isLoading ||
    subscriptions.isLoading ||
    clients.isLoading ||
    orders.isLoading
  ) {
    return <Skeleton className="rounded-card mx-auto h-96 max-w-5xl" />;
  }

  const today = todayIn(new Date());
  const indicators = clubIndicators(
    subscriptions.data ?? [],
    plans.data ?? [],
    atTime(`${today.slice(0, 7)}-01`, "00:00"),
  );
  const serviceName = (id: string) =>
    services.data?.find((s) => s.id === id)?.name ?? "Serviço";
  const subs = (subscriptions.data ?? [])
    .filter((s) =>
      status === ALL ? s.status !== "canceled" : s.status === status,
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader title="Clube" />
      <dl className="rounded-card border-border bg-surface grid grid-cols-2 gap-4 border p-5 md:grid-cols-5">
        {[
          ["Assinantes ativos", String(indicators.active)],
          ["Receita recorrente", formatBRL(indicators.mrrCents)],
          ["Novos no mês", String(indicators.newThisMonth)],
          ["Cancelaram no mês", String(indicators.canceledThisMonth)],
          ["Inadimplentes", String(indicators.pastDue)],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-text-muted text-sm">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <Tabs defaultValue={search.get("status") ? "subs" : "plans"}>
        <TabsList>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="subs">Assinantes</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="flex flex-col gap-3 pt-4">
          <Button className="self-start" onClick={() => setEditing("new")}>
            <Plus strokeWidth={1.75} aria-hidden />
            Novo plano
          </Button>
          <ul className="grid gap-3 md:grid-cols-3">
            {(plans.data ?? []).map((plan) => (
              <li
                key={plan.id}
                className={cn(
                  "rounded-card border-border bg-surface flex flex-col gap-2 border p-4",
                  !plan.active && "opacity-70",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span>
                    <span className="block font-semibold">{plan.name}</span>
                    <span className="tabular-nums">
                      {formatBRL(plan.priceCents)}/mês
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar plano ${plan.name}`}
                    onClick={() => setEditing(plan)}
                  >
                    <Pencil strokeWidth={1.75} aria-hidden />
                  </Button>
                </div>
                <ul className="text-text-muted text-sm">
                  {plan.benefits.map((b) => (
                    <li key={b.serviceId}>
                      {benefitLabel(serviceName(b.serviceId), b.monthlyLimit)}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto text-sm">
                  {plan.active ? "Ativo" : "Inativo"}
                  {plan.recommended && " · Recomendado"} ·{" "}
                  {
                    (subscriptions.data ?? []).filter(
                      (s) => s.planId === plan.id && s.status !== "canceled",
                    ).length
                  }{" "}
                  assinantes
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="subs" className="flex flex-col gap-3 pt-4">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar por status"
          >
            {[ALL, ...SubscriptionStatusSchema.options].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "primary" : "secondary"}
                aria-pressed={status === s}
                onClick={() =>
                  router.replace(
                    s === ALL ? pathname : `${pathname}?status=${s}`,
                    { scroll: false },
                  )
                }
              >
                {s === ALL
                  ? "Vigentes"
                  : SUBSCRIPTION_STATUS_SHORT[
                      s as keyof typeof SUBSCRIPTION_STATUS_SHORT
                    ]}
              </Button>
            ))}
          </div>
          {subs.length === 0 ? (
            <EmptyState
              icon={Crown}
              title="Nenhum assinante neste filtro"
              description="Troque o filtro acima para ver outros status."
            />
          ) : (
            <div className="rounded-card border-border bg-surface overflow-x-auto border">
              <table className="w-full text-sm">
                <thead className="text-text-muted text-left">
                  <tr className="border-border border-b">
                    <th className="px-4 py-2 font-normal">Cliente</th>
                    <th className="px-4 py-2 font-normal">Plano</th>
                    <th className="px-4 py-2 font-normal">Status</th>
                    <th className="px-4 py-2 font-normal">Desde</th>
                    <th className="px-4 py-2 font-normal">Próxima cobrança</th>
                    <th className="px-4 py-2 font-normal">Uso no período</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => {
                    const plan = plans.data?.find((p) => p.id === s.planId);
                    const usage = planUsage(s, orders.data ?? []);
                    const used = Object.values(usage.byService).reduce(
                      (a, b) => a + b,
                      0,
                    );
                    return (
                      <tr
                        key={s.id}
                        className="border-border border-b last:border-0"
                      >
                        <td className="px-4 py-2">
                          <Link
                            href={`/admin/clientes/${s.clientId}`}
                            className="hover:underline"
                          >
                            {clients.data?.find((c) => c.id === s.clientId)
                              ?.name ?? "Cliente"}
                          </Link>
                        </td>
                        <td className="px-4 py-2">{plan?.name ?? "—"}</td>
                        <td
                          className={cn(
                            "px-4 py-2",
                            s.status === "past_due" &&
                              "text-danger font-medium",
                          )}
                        >
                          {SUBSCRIPTION_STATUS_SHORT[s.status]}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {formatDate(s.startedAt, "dd/MM/yy")}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {s.status === "active" || s.status === "past_due"
                            ? formatDate(s.currentPeriodEnd, "dd/MM/yy")
                            : "—"}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {used} {used === 1 ? "uso" : "usos"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {editing && (
        <PlanFormDialog
          plan={editing === "new" ? null : editing}
          services={services.data ?? []}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

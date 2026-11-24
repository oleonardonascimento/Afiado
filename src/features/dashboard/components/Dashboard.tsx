"use client";

/** A2: dashboard. Dono e recepção veem o resumo completo; barbeiro vê a versão reduzida. */
import { AlertTriangle, Cake, Package, UserMinus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarberDashboard } from "@/features/dashboard/components/BarberDashboard";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { useStaffMember } from "@/hooks/useSession";
import { cn } from "@/lib/cn";
import { formatBRL, formatDate, formatTime } from "@/lib/format";
import { firstName } from "@/lib/labels";

const BarChartCard = dynamic(() => import("@/components/shared/BarChartCard"), {
  ssr: false,
  loading: () => <Skeleton className="rounded-card h-72" />,
});

const reais = (cents: number) => formatBRL(cents).replace(",00", "");

function Change({ value }: { value: number | null }) {
  if (value === null)
    return (
      <span className="text-text-muted text-sm">sem base de comparação</span>
    );
  const up = value >= 0;
  return (
    <span
      className={cn(
        "text-sm tabular-nums",
        up ? "text-success" : "text-danger",
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(value)}%{" "}
      <span className="text-text-muted">vs. período anterior</span>
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-3">
      <dt className="text-text-muted text-sm">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd>{hint}</dd>}
    </div>
  );
}

export function Dashboard() {
  const { role, staff } = useStaffMember();
  const { data, isLoading, isError, refetch } = useDashboard();

  if (role === "barber") return <BarberDashboard staffId={staff?.id ?? null} />;

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !data) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="rounded-card h-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="rounded-card h-72" />
          <Skeleton className="rounded-card h-72" />
        </div>
      </div>
    );
  }

  const clientName = (id: string) =>
    data.clients.find((c) => c.id === id)?.name ?? "Cliente";
  const proName = (id: string) =>
    firstName(data.professionals.find((p) => p.id === id)?.name ?? "");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        title="Início"
        description={`Resumo de ${formatDate(`${data.today}T15:00:00.000Z`, "dd/MM/yyyy")}`}
      >
        <Button asChild variant="primary">
          <Link href="/admin/agenda">Abrir agenda</Link>
        </Button>
      </PageHeader>

      <section
        aria-label="Indicadores"
        className="rounded-card border-border bg-surface flex flex-col gap-4 border p-5"
      >
        <div className="flex flex-col gap-1">
          <p className="text-text-muted text-sm">Faturamento hoje</p>
          <p className="font-display text-4xl uppercase tabular-nums">
            {reais(data.revenueToday)}
          </p>
          <Change value={data.revenueTodayChange} />
        </div>
        <dl className="border-border grid grid-cols-2 gap-x-6 border-t md:grid-cols-4">
          <Stat
            label="Faturamento do mês"
            value={reais(data.revenueMonth)}
            hint={<Change value={data.revenueMonthChange} />}
          />
          <Stat
            label="Atendimentos hoje"
            value={`${data.todayDone} feitos`}
            hint={
              <span className="text-text-muted text-sm">
                {data.todayRemaining} restantes
              </span>
            }
          />
          <Stat label="Ocupação hoje" value={`${data.occupancyToday}%`} />
          <Stat
            label="Ticket médio do mês"
            value={formatBRL(data.averageTicket)}
          />
          <Stat label="Faltas no mês" value={String(data.noShowsMonth)} />
          <Stat
            label="Assinantes ativos"
            value={String(data.activeSubscribers)}
          />
          <Stat label="Receita recorrente (MRR)" value={reais(data.mrr)} />
          <Stat
            label="Inadimplentes"
            value={String(data.pastDue)}
            hint={
              data.pastDue > 0 ? (
                <Link
                  href="/admin/clube?status=past_due"
                  className="text-sm underline underline-offset-4"
                >
                  Ver assinantes
                </Link>
              ) : undefined
            }
          />
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <BarChartCard
            title="Faturamento nos últimos 30 dias"
            data={data.revenue30.map((d) => ({
              label: d.date.slice(8, 10) + "/" + d.date.slice(5, 7),
              value: d.cents,
            }))}
            format={reais}
          />
        </div>
        <BarChartCard
          title="Ocupação por barbeiro nos últimos 7 dias"
          data={data.occupancyWeek.map((o) => ({
            label: firstName(o.name),
            value: o.pct,
          }))}
          format={(v) => `${v}%`}
          horizontal
        />
        <BarChartCard
          title="Origem dos clientes"
          data={data.sources.map((s) => ({ label: s.key, value: s.total }))}
          format={(v) => String(v)}
          horizontal
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="next-apts" className="flex flex-col gap-3">
          <h2 id="next-apts" className="text-lg font-semibold">
            Próximos atendimentos de hoje
          </h2>
          {data.upcoming.length === 0 ? (
            <p className="text-text-muted">Nenhum atendimento restante hoje.</p>
          ) : (
            <ul className="divide-border rounded-card border-border bg-surface divide-y border">
              {data.upcoming.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="font-medium tabular-nums">
                      {formatTime(a.start)}
                    </span>{" "}
                    <span className="truncate">{clientName(a.clientId)}</span>
                    <span className="text-text-muted block text-sm">
                      com {proName(a.professionalId)}
                    </span>
                  </span>
                  <AppointmentStatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <ListSection
          id="birthdays"
          title="Aniversariantes da semana"
          icon={Cake}
          empty="Nenhum aniversário nos próximos 7 dias."
        >
          {data.birthdays.map((c) => (
            <li key={c.id} className="flex justify-between gap-3 px-4 py-3">
              <Link
                href={`/admin/clientes/${c.id}`}
                className="truncate hover:underline"
              >
                {c.name}
              </Link>
              <span className="text-text-muted tabular-nums">
                {c.birthday?.slice(8, 10)}/{c.birthday?.slice(5, 7)}
              </span>
            </li>
          ))}
        </ListSection>

        <ListSection
          id="lapsed"
          title="Clientes sumidos (mais de 45 dias)"
          icon={UserMinus}
          empty="Ninguém sumido. Bom sinal."
        >
          {data.lapsed.map(({ client, daysAway }) => (
            <li
              key={client.id}
              className="flex justify-between gap-3 px-4 py-3"
            >
              <Link
                href={`/admin/clientes/${client.id}`}
                className="truncate hover:underline"
              >
                {client.name}
              </Link>
              <span className="text-text-muted tabular-nums">
                {daysAway} dias
              </span>
            </li>
          ))}
        </ListSection>

        <ListSection
          id="stock"
          title="Estoque baixo"
          icon={Package}
          empty="Todos os produtos acima do estoque mínimo."
        >
          {data.lowStock.map((p) => (
            <li key={p.id} className="flex justify-between gap-3 px-4 py-3">
              <span className="inline-flex items-center gap-2 truncate">
                <AlertTriangle
                  className="text-warning size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                {p.name}
              </span>
              <span className="text-text-muted tabular-nums">
                {p.stock} un. (mín. {p.minStock})
              </span>
            </li>
          ))}
        </ListSection>
      </div>
    </div>
  );
}

function ListSection({
  id,
  title,
  icon: Icon,
  empty,
  children,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2
        id={id}
        className="inline-flex items-center gap-2 text-lg font-semibold"
      >
        <Icon
          className="text-text-muted size-5"
          strokeWidth={1.75}
          aria-hidden
        />
        {title}
      </h2>
      {children.length === 0 ? (
        <p className="text-text-muted">{empty}</p>
      ) : (
        <ul className="divide-border rounded-card border-border bg-surface divide-y border">
          {children}
        </ul>
      )}
    </section>
  );
}

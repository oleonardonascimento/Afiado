"use client";

/** A2 (barbeiro): seus atendimentos de hoje e sua comissão do mês. */
import Link from "next/link";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { formatBRL, formatTime } from "@/lib/format";
import { dateOf } from "@/lib/calendar";

export function BarberDashboard({ staffId }: { staffId: string | null }) {
  const { data, isLoading, isError, refetch } = useDashboard();
  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !data || !staffId)
    return <Skeleton className="rounded-card h-64" />;

  const mine = data.appointments
    .filter(
      (a) =>
        a.professionalId === staffId &&
        dateOf(a.start) === data.today &&
        a.status !== "canceled",
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  const commissionMonth = data.commissions
    .filter((c) => c.professionalId === staffId && c.date >= data.monthStartIso)
    .reduce((sum, c) => sum + c.amountCents, 0);
  const clientName = (id: string) =>
    data.clients.find((c) => c.id === id)?.name ?? "Cliente";
  const serviceNames = (ids: string[]) =>
    ids
      .map((id) => data.services.find((s) => s.id === id)?.name ?? "Serviço")
      .join(", ");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Início">
        <Button asChild variant="primary">
          <Link href="/admin/agenda">Abrir minha agenda</Link>
        </Button>
      </PageHeader>
      <section
        aria-label="Sua comissão"
        className="rounded-card border-border bg-surface flex flex-col gap-1 border p-5"
      >
        <p className="text-text-muted text-sm">Sua comissão neste mês</p>
        <p className="font-display text-4xl uppercase tabular-nums">
          {formatBRL(commissionMonth)}
        </p>
        <Link
          href="/admin/comissoes"
          className="text-sm underline underline-offset-4"
        >
          Ver extrato
        </Link>
      </section>
      <section aria-labelledby="today" className="flex flex-col gap-3">
        <h2 id="today" className="text-lg font-semibold">
          Seus atendimentos de hoje ({mine.length})
        </h2>
        {mine.length === 0 ? (
          <p className="text-text-muted">
            Nenhum atendimento marcado para você hoje.
          </p>
        ) : (
          <ul className="divide-border rounded-card border-border bg-surface divide-y border">
            {mine.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="font-medium tabular-nums">
                    {formatTime(a.start)}
                  </span>{" "}
                  {clientName(a.clientId)}
                  <span className="text-text-muted block truncate text-sm">
                    {serviceNames(a.serviceIds)}
                  </span>
                </span>
                <AppointmentStatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

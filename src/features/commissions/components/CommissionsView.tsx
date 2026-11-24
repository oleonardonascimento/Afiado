"use client";

/**
 * A13: comissões por período — resumo por barbeiro e extrato linha a linha.
 * Dono vê todos e marca como pago; barbeiro vê só o próprio extrato.
 */
import { CheckCircle2, Percent } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { commissionSummary } from "@/domain/commission";
import type { Commission } from "@/domain/entities";
import { useProfessionals } from "@/features/catalog/hooks/useCatalog";
import {
  useCommissions,
  useMarkCommissionsPaid,
} from "@/features/commissions/hooks/useCommissions";
import { useStaffMember } from "@/hooks/useSession";
import { dateOf, todayIn } from "@/lib/calendar";
import { formatBRL, formatDate } from "@/lib/format";

const KIND_LABEL: Record<Commission["kind"], string> = {
  service: "Serviço",
  product: "Produto",
  club: "Clube",
};

export function CommissionsView() {
  const commissions = useCommissions();
  const professionals = useProfessionals();
  const { role, staff, isLoading: staffLoading } = useStaffMember();
  const markPaid = useMarkCommissionsPaid();
  const today = todayIn(new Date());
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const [selectedPro, setSelectedPro] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    ids: string[];
    name: string;
    cents: number;
  } | null>(null);

  if (commissions.isError)
    return <ErrorState onRetry={() => void commissions.refetch()} />;
  const loading =
    commissions.isLoading || professionals.isLoading || staffLoading;
  const isOwner = role === "owner";
  const nameOf = (id: string) =>
    professionals.data?.find((p) => p.id === id)?.name ?? "Barbeiro";

  const inPeriod = (commissions.data ?? []).filter((c) => {
    const d = dateOf(c.date);
    return d >= from && d <= to && (isOwner || c.professionalId === staff?.id);
  });
  const summary = commissionSummary(inPeriod).sort((a, b) =>
    nameOf(a.professionalId).localeCompare(nameOf(b.professionalId)),
  );
  const focusPro = isOwner ? selectedPro : (staff?.id ?? null);
  const lines = inPeriod
    .filter((c) => !focusPro || c.professionalId === focusPro)
    .sort((a, b) => b.date.localeCompare(a.date));

  const doMarkPaid = () => {
    if (!confirm) return;
    markPaid.mutate(confirm.ids, {
      onSuccess: () => {
        toast.success(`Comissão de ${confirm.name} marcada como paga`);
        setConfirm(null);
      },
      onError: () =>
        toast.error("Não foi possível marcar como pago. Tente de novo."),
    });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title={isOwner ? "Comissões" : "Minhas comissões"}
        description="Calculadas automaticamente ao fechar cada comanda."
      />
      <div className="flex flex-wrap gap-3">
        <FormField id="com-from" label="De">
          <Input
            type="date"
            value={from}
            max={to}
            onChange={(e) => e.target.value && setFrom(e.target.value)}
          />
        </FormField>
        <FormField id="com-to" label="Até">
          <Input
            type="date"
            value={to}
            min={from}
            onChange={(e) => e.target.value && setTo(e.target.value)}
          />
        </FormField>
      </div>

      {loading ? (
        <Skeleton className="rounded-card h-64" />
      ) : inPeriod.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nenhuma comissão no período"
          description="As comissões aparecem aqui quando uma comanda é fechada. Mude as datas para ver outro período."
        />
      ) : (
        <>
          <section
            aria-labelledby="com-summary"
            className="flex flex-col gap-2"
          >
            <h2 id="com-summary" className="text-lg font-semibold">
              Resumo
            </h2>
            <div className="rounded-card border-border bg-surface overflow-x-auto border">
              <table className="w-full text-sm">
                <thead className="text-text-muted text-left">
                  <tr className="border-border border-b">
                    <th className="px-4 py-2 font-normal">Barbeiro</th>
                    <th className="px-4 py-2 text-right font-normal">
                      Serviços
                    </th>
                    <th className="px-4 py-2 text-right font-normal">
                      Produtos
                    </th>
                    <th className="px-4 py-2 text-right font-normal">Clube</th>
                    <th className="px-4 py-2 text-right font-normal">Total</th>
                    <th className="px-4 py-2 text-right font-normal">Pago</th>
                    <th className="px-4 py-2 text-right font-normal">
                      A pagar
                    </th>
                    {isOwner && (
                      <th className="px-4 py-2">
                        <span className="sr-only">Ações</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="whitespace-nowrap tabular-nums">
                  {summary.map((row) => {
                    const name = nameOf(row.professionalId);
                    const unpaid = inPeriod.filter(
                      (c) =>
                        c.professionalId === row.professionalId && !c.paidAt,
                    );
                    return (
                      <tr
                        key={row.professionalId}
                        className="border-border border-b last:border-0"
                      >
                        <td className="px-4 py-2">
                          {isOwner ? (
                            <button
                              type="button"
                              className="min-h-11 text-left font-medium hover:underline"
                              aria-pressed={selectedPro === row.professionalId}
                              onClick={() =>
                                setSelectedPro(
                                  selectedPro === row.professionalId
                                    ? null
                                    : row.professionalId,
                                )
                              }
                            >
                              {name}
                            </button>
                          ) : (
                            <span className="font-medium">{name}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatBRL(row.serviceCents)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatBRL(row.productCents)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatBRL(row.clubCents)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatBRL(row.totalCents)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatBRL(row.paidCents)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatBRL(row.toPayCents)}
                        </td>
                        {isOwner && (
                          <td className="px-4 py-2 text-right">
                            {unpaid.length > 0 ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  setConfirm({
                                    ids: unpaid.map((c) => c.id),
                                    name,
                                    cents: row.toPayCents,
                                  })
                                }
                              >
                                Marcar como pago
                              </Button>
                            ) : (
                              <span className="text-success inline-flex items-center gap-1">
                                <CheckCircle2
                                  className="size-4"
                                  strokeWidth={1.75}
                                  aria-hidden
                                />
                                Pago
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {isOwner && (
              <p className="text-text-muted text-sm">
                Toque no nome do barbeiro para filtrar o extrato.
              </p>
            )}
          </section>

          <section aria-labelledby="com-lines" className="flex flex-col gap-2">
            <h2 id="com-lines" className="text-lg font-semibold">
              Extrato{focusPro && isOwner ? ` de ${nameOf(focusPro)}` : ""}
            </h2>
            <ul className="divide-border rounded-card border-border bg-surface divide-y border text-sm">
              {lines.slice(0, 200).map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2"
                >
                  <span className="min-w-0">
                    <span className="tabular-nums">
                      {formatDate(c.date, "dd/MM")}
                    </span>{" "}
                    · {KIND_LABEL[c.kind]}
                    {isOwner && !focusPro && (
                      <> · {nameOf(c.professionalId)}</>
                    )}{" "}
                    ·{" "}
                    <Link
                      href={`/admin/comandas/${c.orderId}`}
                      className="underline-offset-2 hover:underline"
                    >
                      ver comanda
                    </Link>
                  </span>
                  <span className="flex items-center gap-3 tabular-nums">
                    <span className="text-text-muted">
                      {c.pct === null
                        ? "valor fixo"
                        : `${c.pct}% de ${formatBRL(c.baseCents)}`}
                    </span>
                    <span className="font-medium">
                      {formatBRL(c.amountCents)}
                    </span>
                    <span
                      className={c.paidAt ? "text-success" : "text-text-muted"}
                    >
                      {c.paidAt ? "pago" : "a pagar"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {lines.length > 200 && (
              <p className="text-text-muted text-sm">
                Mostrando as 200 mais recentes. Encurte o período para ver as
                demais.
              </p>
            )}
          </section>
        </>
      )}

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            Marcar {confirm && formatBRL(confirm.cents)} como pago?
          </AlertDialogTitle>
          <AlertDialogDescription>
            As {confirm?.ids.length} comissões em aberto de {confirm?.name} no
            período ficam registradas como pagas hoje.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                doMarkPaid();
              }}
            >
              Marcar como pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

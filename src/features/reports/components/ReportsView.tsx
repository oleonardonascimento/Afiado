"use client";

/** A14: relatórios do período — faturamento, serviços, retenção, Clube e origem; exporta CSV. */
import { Download } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { FormField } from "@/components/shared/FormField";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PAYMENT_METHODS } from "@/domain/entities";
import { orderTotals } from "@/domain/order";
import { useReports } from "@/features/reports/hooks/useReports";
import { middayIso, todayIn } from "@/lib/calendar";
import { downloadText, toCsv } from "@/lib/csv";
import { centsToInput, formatBRL, formatDate } from "@/lib/format";
import { CLIENT_SOURCE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/labels";

const BarChartCard = dynamic(() => import("@/components/shared/BarChartCard"), {
  ssr: false,
  loading: () => <Skeleton className="rounded-card h-72" />,
});

const reais = (cents: number) => formatBRL(cents).replace(",00", "");
const shortDate = (date: string) => formatDate(middayIso(date), "dd/MM");

export function ReportsView() {
  const today = todayIn(new Date());
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const { data, isError, refetch } = useReports(from, to);

  const exportCsv = () => {
    if (!data) return;
    const rows = data.csvRows.map(({ order, client, professional }) => [
      formatDate(order.closedAt ?? order.openedAt, "dd/MM/yyyy HH:mm"),
      client,
      professional,
      order.items.map((i) => `${i.quantity}x ${i.name}`).join(", "),
      centsToInput(orderTotals(order).totalCents),
      order.payments.map((p) => PAYMENT_METHOD_LABEL[p.method]).join(" + ") ||
        "Clube",
    ]);
    downloadText(
      `afiado-comandas-${from}-a-${to}.csv`,
      toCsv(
        [
          "Fechada em",
          "Cliente",
          "Barbeiro",
          "Itens",
          "Total (R$)",
          "Pagamento",
        ],
        rows,
      ),
    );
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Relatórios">
        <Button
          variant="secondary"
          onClick={exportCsv}
          disabled={!data || data.orderCount === 0}
        >
          <Download strokeWidth={1.75} aria-hidden />
          Exportar comandas (CSV)
        </Button>
      </PageHeader>
      <div className="flex flex-wrap gap-3">
        <FormField id="rep-from" label="De">
          <Input
            type="date"
            value={from}
            max={to}
            onChange={(e) => e.target.value && setFrom(e.target.value)}
          />
        </FormField>
        <FormField id="rep-to" label="Até">
          <Input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => e.target.value && setTo(e.target.value)}
          />
        </FormField>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data ? (
        <Skeleton className="rounded-card h-96" />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Faturamento" value={formatBRL(data.totalCents)} />
            <Stat label="Comandas fechadas" value={String(data.orderCount)} />
            <Stat
              label="Ticket médio"
              value={formatBRL(data.averageTicketCents)}
            />
            <Stat
              label="Voltaram em 30 / 60 dias"
              value={`${data.retention30.pct ?? "—"}% / ${data.retention60.pct ?? "—"}%`}
              hint={
                data.retention30.eligible === 0
                  ? "Nenhum cliente que já tinha vindo antes."
                  : `De ${data.retention30.eligible} clientes que já tinham vindo antes.`
              }
            />
          </dl>

          <div className="grid gap-4 lg:grid-cols-2">
            {data.byDay.length > 0 ? (
              <BarChartCard
                title="Faturamento por dia"
                data={data.byDay.map((d) => ({
                  label: shortDate(d.date),
                  value: d.cents,
                }))}
                format={reais}
              />
            ) : (
              <p className="rounded-card border-border text-text-muted border p-4 text-sm">
                O gráfico por dia aparece para períodos de até 2 meses.
              </p>
            )}
            <BarChartCard
              title="Faturamento por barbeiro"
              data={data.byProfessional.map((r) => ({
                label: r.name,
                value: r.total,
              }))}
              format={reais}
              horizontal
            />
            <BarChartCard
              title="Assinantes do Clube no fim de cada mês"
              data={data.clubByMonth.map((m) => ({
                label: formatDate(middayIso(m.date), "MMM"),
                value: m.count,
              }))}
              format={(v) => String(v)}
            />
            {data.sources.length > 0 ? (
              <BarChartCard
                title="Clientes novos por origem"
                data={data.sources.map((s) => ({
                  label:
                    s.key === "none"
                      ? "Não informada"
                      : CLIENT_SOURCE_LABEL[
                          s.key as keyof typeof CLIENT_SOURCE_LABEL
                        ],
                  value: s.total,
                }))}
                format={(v) => String(v)}
                horizontal
              />
            ) : (
              <p className="rounded-card border-border text-text-muted border p-4 text-sm">
                Nenhum cliente novo cadastrado no período.
              </p>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportTable
              caption="Recebido por forma de pagamento"
              head={["Forma", "Valor"]}
              rows={PAYMENT_METHODS.map((m) => [
                PAYMENT_METHOD_LABEL[m],
                formatBRL(data.byMethod[m]),
              ])}
            />
            <ReportTable
              caption="Serviços mais feitos"
              head={["Serviço", "Vezes", "Valor"]}
              rows={data.topServices.map((s) => [
                s.name,
                String(s.count),
                formatBRL(s.cents),
              ])}
              empty="Nenhum serviço no período."
            />
          </div>
          <p className="text-text-muted text-sm">
            Faturamento por barbeiro soma os itens de cada um, antes do desconto
            geral da comanda. Serviços cobertos pelo Clube contam nas vezes, com
            valor zero.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card border-border bg-surface flex flex-col gap-1 border p-4">
      <dt className="text-text-muted text-sm">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-text-muted text-xs">{hint}</dd>}
    </div>
  );
}

type ReportTableProps = {
  caption: string;
  head: string[];
  rows: string[][];
  empty?: string;
};

function ReportTable({ caption, head, rows, empty }: ReportTableProps) {
  return (
    <div className="rounded-card border-border bg-surface overflow-x-auto border p-4">
      <table className="w-full text-sm">
        <caption className="mb-2 text-left font-medium">{caption}</caption>
        <thead className="text-text-muted text-left">
          <tr className="border-border border-b">
            {head.map((h, i) => (
              <th
                key={h}
                className={
                  i === 0 ? "py-2 font-normal" : "py-2 text-right font-normal"
                }
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="text-text-muted py-3">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r[0]} className="border-border border-b last:border-0">
                {r.map((cell, i) => (
                  <td
                    key={i}
                    className={
                      i === 0 ? "py-2" : "py-2 text-right whitespace-nowrap"
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

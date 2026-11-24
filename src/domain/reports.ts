/** Relatórios do dono (PRD A14). Funções puras; datas do período em YYYY-MM-DD, inclusivas. */
import { itemTotalCents } from "@/domain/commission";
import type {
  Appointment,
  Client,
  Order,
  PaymentMethod,
  Subscription,
} from "@/domain/entities";
import { groupSum } from "@/domain/metrics";
import { orderTotals } from "@/domain/order";
import { dateOf, diffDays } from "@/lib/calendar";

export function closedOrdersBetween(
  orders: Order[],
  from: string,
  to: string,
): Order[] {
  return orders.filter((o) => {
    if (o.status !== "closed" || !o.closedAt) return false;
    const d = dateOf(o.closedAt);
    return d >= from && d <= to;
  });
}

/** Valor recebido por forma de pagamento; o troco sai do dinheiro. */
export function revenueByPaymentMethod(
  orders: Order[],
): Record<PaymentMethod, number> {
  const out: Record<PaymentMethod, number> = {
    cash: 0,
    pix: 0,
    debit: 0,
    credit: 0,
  };
  for (const o of orders) {
    for (const p of o.payments) out[p.method] += p.amountCents;
    out.cash -= orderTotals(o).changeCents;
  }
  return out;
}

/** Faturamento por barbeiro: soma dos itens dele, já com o desconto do item (antes do desconto geral da comanda). */
export function revenueByProfessional(orders: Order[]) {
  return groupSum(
    orders.flatMap((o) => o.items),
    (i) => i.professionalId,
    (i) => itemTotalCents(i),
  );
}

/** Serviços mais feitos (inclui os cobertos pelo Clube) com o valor cobrado por eles. */
export function topServices(orders: Order[], limit: number) {
  const map = new Map<
    string,
    { serviceId: string; count: number; cents: number }
  >();
  for (const i of orders
    .flatMap((o) => o.items)
    .filter((x) => x.kind === "service")) {
    const row = map.get(i.refId) ?? { serviceId: i.refId, count: 0, cents: 0 };
    row.count += i.quantity;
    row.cents += itemTotalCents(i);
    map.set(i.refId, row);
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.cents - a.cents)
    .slice(0, limit);
}

/**
 * Retenção em `days` dias: dos clientes atendidos no período que já tinham vindo antes,
 * quantos voltaram em até `days` dias depois da visita anterior. Cliente novo não entra na conta.
 */
export function retention(
  appointments: Appointment[],
  from: string,
  to: string,
  days: number,
) {
  const visits = new Map<string, string[]>();
  for (const a of appointments.filter((x) => x.status === "done")) {
    const list = visits.get(a.clientId) ?? [];
    list.push(dateOf(a.start));
    visits.set(a.clientId, list);
  }
  let eligible = 0;
  let returned = 0;
  for (const dates of visits.values()) {
    dates.sort();
    const index = dates.findIndex((d) => d >= from && d <= to);
    const previous = index > 0 ? dates[index - 1] : undefined;
    const current = dates[index];
    if (!previous || !current) continue;
    eligible += 1;
    if (diffDays(current, previous) <= days) returned += 1;
  }
  return {
    eligible,
    returned,
    pct: eligible === 0 ? null : Math.round((returned / eligible) * 100),
  };
}

/** Assinantes ativos no fim do dia `date` (quem pediu cancelamento segue ativo até encerrar). */
export function activeSubscribersAt(
  subscriptions: Subscription[],
  date: string,
): number {
  return subscriptions.filter((s) => {
    if (dateOf(s.startedAt) > date) return false;
    if (s.status !== "canceled") return true;
    const endedOn = dateOf(s.canceledAt ?? s.currentPeriodEnd);
    return endedOn > date;
  }).length;
}

/** Novos clientes no período por origem ("none" = não informada). */
export function newClientsBySource(
  clients: Client[],
  from: string,
  to: string,
) {
  return groupSum(
    clients.filter((c) => {
      const d = dateOf(c.createdAt);
      return d >= from && d <= to;
    }),
    (c) => c.source ?? "none",
    () => 1,
  );
}

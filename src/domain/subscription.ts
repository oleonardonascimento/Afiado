/**
 * Clube de assinatura: status, uso no período e benefício aplicável (RF-11, RF-22).
 * O limite mensal conta por período de cobrança (data da assinatura → +1 mês).
 */
import type { Order, Plan, Service, Subscription } from "@/domain/entities";
import { dateOf, diffDays, weekdayOf } from "@/lib/calendar";

export type PlanUsage = {
  byService: Record<string, number>;
  lastCoveredDate: string | null;
};

/** Benefício vale para ativa e "cancelando" até o fim do período pago. */
export function isSubscriptionActive(sub: Subscription, now: Date): boolean {
  if (sub.status !== "active" && sub.status !== "canceling") return false;
  return now.getTime() < Date.parse(sub.currentPeriodEnd);
}

export function planUsage(sub: Subscription, orders: Order[]): PlanUsage {
  const from = Date.parse(sub.currentPeriodStart);
  const to = Date.parse(sub.currentPeriodEnd);
  const byService: Record<string, number> = {};
  let lastCoveredDate: string | null = null;
  for (const order of orders) {
    if (order.clientId !== sub.clientId || order.status !== "closed") continue;
    const when = order.closedAt ?? order.openedAt;
    const ms = Date.parse(when);
    if (ms < from || ms >= to) continue;
    for (const item of order.items) {
      if (!item.clubCovered) continue;
      byService[item.refId] = (byService[item.refId] ?? 0) + item.quantity;
      const day = dateOf(when);
      if (!lastCoveredDate || day > lastCoveredDate) lastCoveredDate = day;
    }
  }
  return { byService, lastCoveredDate };
}

export function coveredServiceIds(
  plan: Plan,
  usage: PlanUsage,
  serviceIds: string[],
  date: string,
): string[] {
  if (!plan.rules.allowedWeekdays.includes(weekdayOf(date))) return [];
  if (
    usage.lastCoveredDate &&
    diffDays(date, usage.lastCoveredDate) < plan.rules.minDaysBetweenUses
  ) {
    return [];
  }
  return serviceIds.filter((id) => {
    const benefit = plan.benefits.find((b) => b.serviceId === id);
    if (!benefit) return false;
    return (
      benefit.monthlyLimit === null ||
      (usage.byService[id] ?? 0) < benefit.monthlyLimit
    );
  });
}

export type BookingTotals = {
  durationMinutes: number;
  priceCents: number;
  coveredCents: number;
  payableCents: number;
};

export function bookingTotals(
  chosen: Service[],
  coveredIds: string[],
): BookingTotals {
  const durationMinutes = chosen.reduce((s, x) => s + x.durationMinutes, 0);
  const priceCents = chosen.reduce((s, x) => s + x.priceCents, 0);
  const coveredCents = chosen
    .filter((x) => coveredIds.includes(x.id))
    .reduce((s, x) => s + x.priceCents, 0);
  return {
    durationMinutes,
    priceCents,
    coveredCents,
    payableCents: priceCents - coveredCents,
  };
}

/** Uso restante legível: "2 de 4 barbas" ou "à vontade". */
export function remainingLabel(limit: number | null, used: number): string {
  return limit === null ? "à vontade" : `${used} de ${limit}`;
}

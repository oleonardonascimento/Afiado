/**
 * Métricas do dashboard e dos relatórios (PRD A2, A14). Funções puras sobre os dados do mock;
 * na V2 o backend pode calcular as mesmas coisas.
 */
import { workMinutes } from "@/domain/availability";
import type { Appointment, Barbershop, Client, Order, Plan, Product, Professional, Subscription } from "@/domain/entities";
import { orderTotals } from "@/domain/order";
import { dateOf, diffDays } from "@/lib/calendar";

const closed = (orders: Order[]) => orders.filter((o) => o.status === "closed" && o.closedAt);

export function revenueBetween(orders: Order[], fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  return closed(orders)
    .filter((o) => {
      const t = Date.parse(o.closedAt as string);
      return t >= from && t < to;
    })
    .reduce((sum, o) => sum + orderTotals(o).totalCents, 0);
}

export function revenueByDay(orders: Order[], dates: string[]): { date: string; cents: number }[] {
  const byDate = new Map(dates.map((d) => [d, 0]));
  for (const o of closed(orders)) {
    const day = dateOf(o.closedAt as string);
    if (byDate.has(day)) byDate.set(day, (byDate.get(day) ?? 0) + orderTotals(o).totalCents);
  }
  return dates.map((date) => ({ date, cents: byDate.get(date) ?? 0 }));
}

/** Ticket médio das comandas fechadas que tiveram valor a pagar. */
export function averageTicketCents(orders: Order[]): number {
  const totals = closed(orders)
    .map((o) => orderTotals(o).totalCents)
    .filter((t) => t > 0);
  return totals.length === 0 ? 0 : Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
}

/** Variação % de `current` sobre `previous`; null quando não há base. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function mrrCents(subscriptions: Subscription[], plans: Plan[]): number {
  return subscriptions
    .filter((s) => s.status === "active" || s.status === "canceling")
    .reduce((sum, s) => sum + (plans.find((p) => p.id === s.planId)?.priceCents ?? 0), 0);
}

/** Aniversariantes entre duas datas (inclusive), comparando só mês e dia. */
export function birthdaysBetween(clients: Client[], from: string, to: string): Client[] {
  const a = from.slice(5);
  const b = to.slice(5);
  const wraps = a > b;
  return clients
    .filter((c) => {
      if (!c.birthday) return false;
      const md = c.birthday.slice(5);
      return wraps ? md >= a || md <= b : md >= a && md <= b;
    })
    .sort((x, y) => {
      const mx = (x.birthday as string).slice(5);
      const my = (y.birthday as string).slice(5);
      const kx = wraps && mx < a ? `1${mx}` : `0${mx}`;
      const ky = wraps && my < a ? `1${my}` : `0${my}`;
      return kx.localeCompare(ky);
    });
}

/** Clientes cujo último atendimento concluído foi há mais de `days` dias. */
export function lapsedClients(
  clients: Client[],
  appointments: Appointment[],
  today: string,
  days: number,
): { client: Client; lastVisit: string; daysAway: number }[] {
  const last = new Map<string, string>();
  for (const a of appointments) {
    if (a.status !== "done") continue;
    const day = dateOf(a.start);
    if ((last.get(a.clientId) ?? "") < day) last.set(a.clientId, day);
  }
  return clients
    .flatMap((client) => {
      const lastVisit = last.get(client.id);
      if (!lastVisit) return [];
      const daysAway = diffDays(today, lastVisit);
      return daysAway > days ? [{ client, lastVisit, daysAway }] : [];
    })
    .sort((x, y) => x.daysAway - y.daysAway);
}

export function lowStock(products: Product[]): Product[] {
  return products.filter((p) => p.active && p.stock <= p.minStock).sort((a, b) => a.stock - b.stock);
}

/** Soma `value` por `key`, do maior para o menor. */
export function groupSum<T>(rows: T[], key: (row: T) => string, value: (row: T) => number) {
  const map = new Map<string, number>();
  for (const row of rows) map.set(key(row), (map.get(key(row)) ?? 0) + value(row));
  return [...map.entries()].map(([k, total]) => ({ key: k, total })).sort((a, b) => b.total - a.total);
}

const BUSY: Appointment["status"][] = ["scheduled", "confirmed", "in_service", "done"];

/** Ocupação % por barbeiro nas datas: minutos agendados ÷ minutos de trabalho. */
export function occupancyByProfessional(
  appointments: Appointment[],
  shop: Barbershop,
  professionals: Professional[],
  dates: string[],
): { professionalId: string; name: string; pct: number }[] {
  const days = new Set(dates);
  return professionals
    .filter((p) => p.active && p.serviceIds.length > 0)
    .map((pro) => {
      const available = dates.reduce((sum, d) => sum + workMinutes(shop, pro, d), 0);
      const booked = appointments
        .filter((a) => a.professionalId === pro.id && BUSY.includes(a.status) && days.has(dateOf(a.start)))
        .reduce((sum, a) => sum + (Date.parse(a.end) - Date.parse(a.start)) / 60_000, 0);
      return {
        professionalId: pro.id,
        name: pro.name,
        pct: available === 0 ? 0 : Math.min(100, Math.round((booked / available) * 100)),
      };
    });
}

/**
 * Seed determinístico de demonstração (PRD RNF-07): mesmo `now` ⇒ mesmo snapshot.
 * Datas relativas a "hoje" no fuso de São Paulo, para a demo parecer viva.
 */
import { createEmptySnapshot } from "@/data/mock/empty-snapshot";
import {
  FIRST_NAMES,
  LAST_NAMES,
  REVIEW_COMMENTS,
  plans,
  products,
  professionals,
  services,
  shop,
} from "@/data/mock/seed-catalog";
import { commissionForItem, itemTotalCents } from "@/domain/commission";
import type {
  Appointment,
  CashMovement,
  CashSession,
  Charge,
  Client,
  ClientSource,
  DbSnapshot,
  Order,
  OrderItem,
  PaymentMethod,
  Professional,
  Subscription,
  TimeOff,
} from "@/domain/entities";
import {
  addDays,
  addMonths,
  atTime,
  dateOf,
  diffDays,
  fromMinutes,
  toMinutes,
  todayIn,
  weekdayOf,
} from "@/lib/calendar";
import { createRandom, type Random } from "@/lib/random";

const HISTORY_DAYS = 90;
const FUTURE_DAYS = 14;
const OPENING_CENTS = 20000;

const SERVICE_COMBOS: readonly (readonly [string[], number])[] = [
  [["svc-1"], 35],
  [["svc-2"], 22],
  [["svc-3"], 10],
  [["svc-6"], 10],
  [["svc-5"], 5],
  [["svc-1", "svc-7"], 5],
  [["svc-8"], 4],
  [["svc-4"], 3],
  [["svc-1", "svc-10"], 2],
  [["svc-9"], 2],
  [["svc-11"], 1],
  [["svc-12"], 1],
];

const PAYMENT_WEIGHTS: readonly (readonly [PaymentMethod, number])[] = [
  ["pix", 45],
  ["credit", 20],
  ["debit", 20],
  ["cash", 15],
];

const SOURCES: readonly (readonly [ClientSource | null, number])[] = [
  ["instagram", 30],
  ["indicacao", 25],
  ["google", 20],
  ["passando", 15],
  ["outro", 5],
  [null, 5],
];

type Ctx = {
  rng: Random;
  now: number;
  today: string;
  db: DbSnapshot;
  seq: Record<string, number>;
};

const nextId = (ctx: Ctx, prefix: string) => {
  ctx.seq[prefix] = (ctx.seq[prefix] ?? 0) + 1;
  return `${prefix}-${ctx.seq[prefix]}`;
};

export function generateSeed(now: Date): DbSnapshot {
  const db = createEmptySnapshot();
  const ctx: Ctx = { rng: createRandom(42), now: now.getTime(), today: todayIn(now), db, seq: {} };

  db.shop = structuredClone(shop);
  db.professionals = structuredClone(professionals);
  db.services = structuredClone(services);
  db.products = structuredClone(products);
  db.plans = structuredClone(plans);
  db.clients = makeClients(ctx);
  db.subscriptions = makeSubscriptions(ctx);
  db.charges = makeCharges(ctx);
  db.timeOff = makeTimeOff(ctx);
  makeAgenda(ctx);
  makeWaitlist(ctx);
  return db;
}

/* ---------------- clientes ---------------- */

function makeClients(ctx: Ctx): Client[] {
  const { rng, today } = ctx;
  return Array.from({ length: 60 }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length] ?? "Cliente";
    const last = LAST_NAMES[(i * 7) % LAST_NAMES.length] ?? "Exemplo";
    const created = addDays(today, -rng.int(100, 400));
    let birthday: string | null = null;
    if (i >= 20 && i < 30) {
      const day = addDays(today, (i - 20) % 7);
      birthday = `${1980 + i}${day.slice(4)}`;
    } else if (rng.chance(0.8)) {
      birthday = `${rng.int(1970, 2008)}-${String(rng.int(1, 12)).padStart(2, "0")}-${String(rng.int(1, 28)).padStart(2, "0")}`;
    }
    const slug = `${first}.${last}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return {
      id: `cli-${i + 1}`,
      name: `${first} ${last}`,
      phone: `619${String(80000000 + i * 104729).slice(0, 8)}`,
      email: rng.chance(0.4) ? `${slug}@exemplo.com` : null,
      birthday,
      source: rng.weighted(SOURCES),
      notes: i % 6 === 0 ? "Máquina 2 na lateral, tesoura em cima." : "",
      tags: i % 9 === 0 ? ["prefere manhã"] : [],
      marketingConsent: rng.chance(0.6),
      createdAt: atTime(created, "10:00"),
    };
  });
}

/** Clientes 51–58 estão "sumidos": nenhuma visita nos últimos 60 dias. */
const isLapsed = (clientId: string) => {
  const n = Number(clientId.split("-")[1]);
  return n >= 51 && n <= 58;
};

/* ---------------- Clube ---------------- */

function makeSubscriptions(ctx: Ctx): Subscription[] {
  const { rng, today } = ctx;
  return Array.from({ length: 18 }, (_, i) => {
    const planId = rng.weighted([
      ["pln-2", 50],
      ["pln-1", 30],
      ["pln-3", 20],
    ] as const);
    const ended = i >= 16;
    const back = ended ? rng.int(120, 260) : rng.int(20, 260);
    const startDate = addDays(today, -back);
    const startDay = `${startDate.slice(0, 8)}${String(Math.min(Number(startDate.slice(8)), 28)).padStart(2, "0")}`;
    let canceledAt: string | null = null;
    let reference = today;
    if (i === 15) canceledAt = atTime(addDays(today, -5), "09:30");
    if (ended) {
      reference = addDays(today, -50);
      canceledAt = atTime(reference, "09:30");
    }
    let k = 0;
    while (addMonths(startDay, k + 1) <= reference) k++;
    const periodStart = addMonths(startDay, k);
    const status: Subscription["status"] =
      i < 13 ? "active" : i < 15 ? "past_due" : i === 15 ? "canceling" : "canceled";
    return {
      id: `sub-${i + 1}`,
      clientId: `cli-${i + 1}`,
      planId,
      status,
      paymentMethod: i % 3 === 0 ? "pix" : "card",
      startedAt: atTime(startDay, "10:00"),
      currentPeriodStart: atTime(periodStart, "00:00"),
      currentPeriodEnd: atTime(addMonths(startDay, k + 1), "00:00"),
      canceledAt,
    };
  });
}

function makeCharges(ctx: Ctx): Charge[] {
  const charges: Charge[] = [];
  for (const sub of ctx.db.subscriptions) {
    const plan = ctx.db.plans.find((p) => p.id === sub.planId);
    if (!plan) continue;
    const start = dateOf(sub.startedAt);
    const last = dateOf(sub.currentPeriodStart);
    for (let k = 0; addMonths(start, k) <= last; k++) {
      const due = addMonths(start, k);
      const isLast = addMonths(start, k + 1) > last;
      const failed = isLast && sub.status === "past_due";
      charges.push({
        id: nextId(ctx, "chg"),
        subscriptionId: sub.id,
        amountCents: plan.priceCents,
        dueDate: due,
        status: failed ? (sub.id === "sub-14" ? "failed" : "pending") : "paid",
        paidAt: failed ? null : atTime(due, "08:00"),
      });
    }
  }
  return charges;
}

function activeSubscription(ctx: Ctx, clientId: string, date: string): Subscription | null {
  const sub = ctx.db.subscriptions.find((s) => s.clientId === clientId);
  if (!sub) return null;
  if (date < dateOf(sub.startedAt)) return null;
  if (sub.canceledAt && date >= dateOf(sub.currentPeriodEnd)) return null;
  if (sub.status === "past_due" && date >= dateOf(sub.currentPeriodStart)) return null;
  return sub;
}

/* ---------------- folgas e bloqueios ---------------- */

function makeTimeOff(ctx: Ctx): TimeOff[] {
  const { today } = ctx;
  return [
    {
      id: "off-1",
      professionalId: "pro-1",
      start: atTime(nextWorkday(today, 1), "15:00"),
      end: atTime(nextWorkday(today, 1), "16:00"),
      kind: "block",
      reason: "Reunião com fornecedor",
    },
    {
      id: "off-2",
      professionalId: "pro-4",
      start: atTime(addDays(today, 5), "00:00"),
      end: atTime(addDays(today, 8), "00:00"),
      kind: "vacation",
      reason: "Férias",
    },
  ];
}

function nextWorkday(from: string, offset: number): string {
  let d = addDays(from, offset);
  while ([0, 1].includes(weekdayOf(d))) d = addDays(d, 1);
  return d;
}

const overlapsTimeOff = (ctx: Ctx, proId: string, startIso: string, endIso: string) =>
  ctx.db.timeOff.some(
    (t) => t.professionalId === proId && t.start < endIso && t.end > startIso,
  );

/* ---------------- agenda, comandas, caixa, comissões ---------------- */

type ClubUsage = Map<string, { lastCovered: string | null; perMonth: Map<string, number> }>;

function makeAgenda(ctx: Ctx) {
  const { db, rng, today } = ctx;
  const working = db.professionals.filter((p) => p.serviceIds.length > 0);
  const usage: ClubUsage = new Map();

  for (let offset = -HISTORY_DAYS; offset <= FUTURE_DAYS; offset++) {
    const date = addDays(today, offset);
    const weekday = weekdayOf(date);
    const shopDay = db.shop.hours.find((h) => h.weekday === weekday);
    if (!shopDay || shopDay.ranges.length === 0) continue;
    const dayOrders: Order[] = [];

    for (const pro of working) {
      const ranges = pro.hours.find((h) => h.weekday === weekday)?.ranges ?? [];
      for (const range of ranges) {
        let cursor = toMinutes(range.start);
        const end = toMinutes(range.end);
        const p = offset < 0 ? 0.36 : Math.max(0.08, 0.3 - offset * 0.02);
        while (cursor < end) {
          if (!rng.chance(p)) {
            cursor += 15;
            continue;
          }
          const combo = pickCombo(rng, pro);
          const duration = combo.reduce(
            (sum, id) => sum + (db.services.find((x) => x.id === id)?.durationMinutes ?? 0),
            0,
          );
          const startIso = atTime(date, fromMinutes(cursor));
          const endIso = atTime(date, fromMinutes(cursor + duration));
          if (cursor + duration > end || overlapsTimeOff(ctx, pro.id, startIso, endIso)) {
            cursor += 15;
            continue;
          }
          const order = createAppointment(ctx, usage, pro, combo, date, startIso, endIso);
          if (order) dayOrders.push(order);
          cursor += duration;
        }
      }
    }
    if (dayOrders.length > 0) makeCashSession(ctx, date, dayOrders);
  }
  db.appointments.sort((a, b) => a.start.localeCompare(b.start));
}

function pickCombo(rng: Random, pro: Professional): string[] {
  for (let tries = 0; tries < 10; tries++) {
    const combo = rng.weighted(SERVICE_COMBOS);
    if (combo.every((id) => pro.serviceIds.includes(id))) return combo;
  }
  return ["svc-1"];
}

function pickClient(ctx: Ctx, date: string): string {
  const { rng, db, today } = ctx;
  const recent = diffDays(today, date) < 60;
  if (rng.chance(0.3)) {
    const subscribers = db.subscriptions
      .filter((s) => activeSubscription(ctx, s.clientId, date))
      .map((s) => s.clientId);
    if (subscribers.length > 0) return rng.pick(subscribers);
  }
  const pool = db.clients.filter(
    (c) => (!recent || !isLapsed(c.id)) && dateOf(c.createdAt) <= date,
  );
  return rng.pick(pool.length > 0 ? pool : db.clients).id;
}

function createAppointment(
  ctx: Ctx,
  usage: ClubUsage,
  pro: Professional,
  combo: string[],
  date: string,
  startIso: string,
  endIso: string,
): Order | null {
  const { rng, db, now } = ctx;
  const clientId = pickClient(ctx, date);
  const priceCents = combo.reduce(
    (sum, id) => sum + (db.services.find((x) => x.id === id)?.priceCents ?? 0),
    0,
  );
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  let status: Appointment["status"];
  if (end <= now) {
    const r = rng.next();
    status = r < 0.05 ? "canceled" : r < 0.11 ? "no_show" : "done";
  } else if (start <= now) {
    status = "in_service";
  } else if (rng.chance(0.03)) {
    status = "canceled";
  } else {
    status = start - now < 2 * 86_400_000 && rng.chance(0.5) ? "confirmed" : "scheduled";
  }
  const appointment: Appointment = {
    id: nextId(ctx, "apt"),
    clientId,
    professionalId: pro.id,
    serviceIds: combo,
    start: startIso,
    end: endIso,
    status,
    priceCents,
    note: rng.chance(0.08) ? "Quer manter o comprimento em cima." : "",
    origin: rng.chance(0.7) ? "online" : "panel",
    createdAt: new Date(start - rng.int(1, 10) * 86_400_000).toISOString(),
    canceledAt: status === "canceled" ? new Date(start - rng.int(2, 30) * 3_600_000).toISOString() : null,
    orderId: null,
  };
  db.appointments.push(appointment);
  if (status !== "done") return null;

  const order = createOrder(ctx, usage, appointment, pro, date);
  appointment.orderId = order.id;
  maybeReview(ctx, appointment);
  return order;
}

function createOrder(
  ctx: Ctx,
  usage: ClubUsage,
  appointment: Appointment,
  pro: Professional,
  date: string,
): Order {
  const { db, rng } = ctx;
  const sub = activeSubscription(ctx, appointment.clientId, date);
  const plan = sub ? db.plans.find((p) => p.id === sub.planId) : undefined;
  const items: OrderItem[] = appointment.serviceIds.map((serviceId) => {
    const service = db.services.find((x) => x.id === serviceId);
    if (!service) throw new Error(`serviço ${serviceId}`);
    return {
      id: nextId(ctx, "itm"),
      kind: "service",
      refId: service.id,
      name: service.name,
      quantity: 1,
      unitPriceCents: service.priceCents,
      discountCents: 0,
      clubCovered: sub && plan ? useClub(usage, sub.id, plan, serviceId, date) : false,
      professionalId: pro.id,
    };
  });
  if (rng.chance(0.12)) {
    const product = rng.pick(db.products);
    items.push({
      id: nextId(ctx, "itm"),
      kind: "product",
      refId: product.id,
      name: product.name,
      quantity: 1,
      unitPriceCents: product.priceCents,
      discountCents: 0,
      clubCovered: false,
      professionalId: pro.id,
    });
  }
  const total = items.reduce((sum, i) => sum + itemTotalCents(i), 0);
  const payments: Order["payments"] = [];
  if (total > 0) {
    if (rng.chance(0.08) && total >= 2000) {
      const cash = Math.round(total / 2 / 100) * 100;
      payments.push({ method: "cash", amountCents: cash }, { method: "pix", amountCents: total - cash });
    } else {
      payments.push({ method: rng.weighted(PAYMENT_WEIGHTS), amountCents: total });
    }
  }
  const order: Order = {
    id: nextId(ctx, "ord"),
    clientId: appointment.clientId,
    professionalId: pro.id,
    appointmentId: appointment.id,
    status: "closed",
    items,
    discountCents: 0,
    payments,
    openedAt: appointment.start,
    closedAt: appointment.end,
    cashSessionId: null,
  };
  db.orders.push(order);

  for (const item of items) {
    const catalogPct =
      item.kind === "service"
        ? (db.services.find((x) => x.id === item.refId)?.commissionPct ?? 0)
        : (db.products.find((x) => x.id === item.refId)?.commissionPct ?? 0);
    const calc = commissionForItem(item, pro, catalogPct);
    db.commissions.push({
      id: nextId(ctx, "com"),
      professionalId: pro.id,
      orderId: order.id,
      orderItemId: item.id,
      date: appointment.end,
      ...calc,
      paidAt: commissionPaidAt(ctx, appointment.end),
    });
  }
  return order;
}

/** Comissões de meses anteriores foram pagas no dia 5 do mês seguinte. */
function commissionPaidAt(ctx: Ctx, iso: string): string | null {
  const date = dateOf(iso);
  const payDay = `${addMonths(`${date.slice(0, 7)}-01`, 1).slice(0, 7)}-05`;
  return payDay <= ctx.today ? atTime(payDay, "10:00") : null;
}

function useClub(
  usage: ClubUsage,
  subId: string,
  plan: DbSnapshot["plans"][number],
  serviceId: string,
  date: string,
): boolean {
  const benefit = plan.benefits.find((b) => b.serviceId === serviceId);
  if (!benefit) return false;
  const entry = usage.get(subId) ?? { lastCovered: null, perMonth: new Map<string, number>() };
  usage.set(subId, entry);
  if (entry.lastCovered && diffDays(date, entry.lastCovered) < plan.rules.minDaysBetweenUses) return false;
  const key = `${serviceId}:${date.slice(0, 7)}`;
  const used = entry.perMonth.get(key) ?? 0;
  if (benefit.monthlyLimit !== null && used >= benefit.monthlyLimit) return false;
  entry.perMonth.set(key, used + 1);
  entry.lastCovered = date;
  return true;
}

function makeCashSession(ctx: Ctx, date: string, orders: Order[]) {
  const { db, rng, today } = ctx;
  const ranges = db.shop.hours.find((h) => h.weekday === weekdayOf(date))?.ranges ?? [];
  const open = ranges[0]?.start ?? "09:00";
  const close = ranges[ranges.length - 1]?.end ?? "20:00";
  const isToday = date === today;
  const session: CashSession = {
    id: nextId(ctx, "cash"),
    openedAt: atTime(date, open),
    openedBy: "pro-5",
    openingCents: OPENING_CENTS,
    closedAt: isToday ? null : atTime(date, close),
    counted: null,
    note: "",
  };
  const movements: CashMovement[] = [];
  for (const order of orders) {
    order.cashSessionId = session.id;
    for (const payment of order.payments) {
      movements.push({
        id: nextId(ctx, "mov"),
        sessionId: session.id,
        kind: "order",
        method: payment.method,
        amountCents: payment.amountCents,
        description: `Comanda ${order.id}`,
        orderId: order.id,
        createdAt: order.closedAt ?? order.openedAt,
      });
    }
  }
  if (!isToday && rng.chance(0.2)) {
    movements.push({
      id: nextId(ctx, "mov"),
      sessionId: session.id,
      kind: "expense",
      method: "cash",
      amountCents: 3500,
      description: "Material de limpeza",
      orderId: null,
      createdAt: atTime(date, "12:00"),
    });
  }
  if (!isToday) {
    const expected = { cash: OPENING_CENTS, pix: 0, debit: 0, credit: 0 };
    for (const m of movements) {
      expected[m.method] += m.kind === "order" || m.kind === "income" ? m.amountCents : -m.amountCents;
    }
    const diff = rng.chance(0.1) ? rng.pick([-500, -200, 300]) : 0;
    session.counted = { ...expected, cash: Math.max(0, expected.cash + diff) };
    session.note = diff !== 0 ? "Diferença no dinheiro conferida no fechamento." : "";
  }
  db.cashSessions.push(session);
  db.cashMovements.push(...movements);
}

function maybeReview(ctx: Ctx, appointment: Appointment) {
  const { rng, db, today } = ctx;
  if (diffDays(today, dateOf(appointment.end)) > 60 || !rng.chance(0.08)) return;
  const rating = rng.weighted([
    [5, 60],
    [4, 30],
    [3, 10],
  ] as const);
  db.reviews.push({
    id: nextId(ctx, "rev"),
    appointmentId: appointment.id,
    clientId: appointment.clientId,
    professionalId: appointment.professionalId,
    rating,
    comment: rng.pick(REVIEW_COMMENTS[rating]),
    createdAt: new Date(Date.parse(appointment.end) + 3 * 3_600_000).toISOString(),
    reply: rng.chance(0.3) ? "Valeu pela visita! Até a próxima." : null,
  });
}

function makeWaitlist(ctx: Ctx) {
  const date = nextWorkday(ctx.today, 3);
  ctx.db.waitlist.push(
    {
      id: "wl-1",
      clientId: "cli-33",
      date,
      serviceIds: ["svc-2"],
      professionalId: "pro-2",
      createdAt: atTime(ctx.today, "08:10"),
      notifiedAt: null,
    },
    {
      id: "wl-2",
      clientId: "cli-41",
      date,
      serviceIds: ["svc-1"],
      professionalId: null,
      createdAt: atTime(ctx.today, "08:40"),
      notifiedAt: null,
    },
  );
}

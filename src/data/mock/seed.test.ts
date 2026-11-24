import { formatInTimeZone } from "date-fns-tz";
import { afterAll, describe, expect, it } from "vitest";
import { generateSeed } from "@/data/mock/seed";
import { DbSnapshotSchema, type DbSnapshot, type WeeklyHours } from "@/domain/entities";
import { TZ } from "@/lib/format";

const NOW = new Date("2026-11-24T15:00:00.000Z"); // terça, 12h em SP
const LATE = new Date("2026-11-24T02:50:00.000Z"); // 23:50 em SP

const originalTz = process.env.TZ;
afterAll(() => {
  process.env.TZ = originalTz;
});

function within(hours: WeeklyHours[], startIso: string, endIso: string): boolean {
  const weekday = Number(formatInTimeZone(startIso, TZ, "i")) % 7;
  const start = formatInTimeZone(startIso, TZ, "HH:mm");
  const end = formatInTimeZone(endIso, TZ, "HH:mm");
  const sameDay = formatInTimeZone(startIso, TZ, "yyyy-MM-dd") === formatInTimeZone(endIso, TZ, "yyyy-MM-dd");
  const day = hours.find((h) => h.weekday === weekday);
  return sameDay && !!day?.ranges.some((r) => r.start <= start && end <= r.end);
}

function checkIntegrity(db: DbSnapshot) {
  const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id));
  const clients = ids(db.clients);
  const pros = ids(db.professionals);
  const services = ids(db.services);
  const orders = ids(db.orders);
  const subs = ids(db.subscriptions);
  for (const a of db.appointments) {
    expect(clients.has(a.clientId)).toBe(true);
    expect(pros.has(a.professionalId)).toBe(true);
    for (const s of a.serviceIds) expect(services.has(s)).toBe(true);
    if (a.orderId) expect(orders.has(a.orderId)).toBe(true);
  }
  for (const o of db.orders) if (o.appointmentId) expect(db.appointments.some((a) => a.id === o.appointmentId)).toBe(true);
  for (const c of db.commissions) expect(orders.has(c.orderId)).toBe(true);
  for (const c of db.charges) expect(subs.has(c.subscriptionId)).toBe(true);
}

function checkSchedule(db: DbSnapshot) {
  const byPro = new Map<string, { s: number; e: number }[]>();
  for (const a of db.appointments) {
    if (a.status === "canceled") continue;
    const pro = db.professionals.find((p) => p.id === a.professionalId);
    if (!pro) throw new Error("pro");
    expect(within(db.shop.hours, a.start, a.end)).toBe(true);
    expect(within(pro.hours, a.start, a.end)).toBe(true);
    const list = byPro.get(a.professionalId) ?? [];
    list.push({ s: Date.parse(a.start), e: Date.parse(a.end) });
    byPro.set(a.professionalId, list);
  }
  for (const list of byPro.values()) {
    list.sort((x, y) => x.s - y.s);
    for (let i = 1; i < list.length; i++) expect(list[i]!.s).toBeGreaterThanOrEqual(list[i - 1]!.e);
  }
}

describe("seed", () => {
  const db = generateSeed(NOW);

  it("é determinístico", () => {
    expect(generateSeed(NOW)).toEqual(db);
  });

  it("tem as contagens do PRD", () => {
    expect(db.professionals).toHaveLength(5);
    expect(db.professionals.filter((p) => p.serviceIds.length > 0)).toHaveLength(4);
    expect(db.services).toHaveLength(12);
    expect(db.clients).toHaveLength(60);
    expect(db.plans).toHaveLength(3);
  });

  it("passa no schema e cabe no localStorage", () => {
    expect(DbSnapshotSchema.safeParse(db).success).toBe(true);
    expect(JSON.stringify(db).length).toBeLessThan(3_500_000);
  });

  it("referências apontam para entidades existentes", () => {
    checkIntegrity(db);
  });

  it("agendamentos dentro do expediente e sem sobreposição", () => {
    checkSchedule(db);
  });

  it("vale perto da meia-noite e com o navegador em outro fuso", () => {
    process.env.TZ = "Asia/Tokyo";
    const late = generateSeed(LATE);
    checkSchedule(late);
    checkIntegrity(late);
  });

  it("duração do agendamento = soma das durações dos serviços", () => {
    for (const a of db.appointments) {
      const minutes = a.serviceIds.reduce(
        (sum, id) => sum + (db.services.find((s) => s.id === id)?.durationMinutes ?? 0),
        0,
      );
      expect((Date.parse(a.end) - Date.parse(a.start)) / 60_000).toBe(minutes);
    }
  });

  it("comissões coerentes com a regra", () => {
    expect(db.commissions.length).toBeGreaterThan(0);
    for (const c of db.commissions) {
      if (c.kind === "club") {
        const pro = db.professionals.find((p) => p.id === c.professionalId);
        expect(c.amountCents).toBe(pro?.clubCommissionCents);
      } else {
        expect(c.amountCents).toBe(Math.round((c.baseCents * (c.pct ?? 0)) / 100));
      }
    }
  });

  it("pagamentos de comanda fechada somam o total", () => {
    for (const o of db.orders.filter((x) => x.status === "closed")) {
      const total = o.items.reduce(
        (sum, i) => sum + (i.clubCovered ? 0 : i.quantity * i.unitPriceCents - i.discountCents),
        0,
      ) - o.discountCents;
      expect(o.payments.reduce((s, p) => s + p.amountCents, 0)).toBe(total);
    }
  });

  it("não há caixa aberto em dia anterior", () => {
    const today = formatInTimeZone(NOW, TZ, "yyyy-MM-dd");
    for (const s of db.cashSessions.filter((x) => x.closedAt === null)) {
      expect(formatInTimeZone(s.openedAt, TZ, "yyyy-MM-dd")).toBe(today);
    }
  });
});

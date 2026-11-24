import { describe, expect, it } from "vitest";
import type { Appointment, Client, Order, Plan, Product, Subscription } from "@/domain/entities";
import {
  averageTicketCents,
  birthdaysBetween,
  clientStats,
  clubIndicators,
  groupSum,
  lapsedClients,
  lowStock,
  occupancyByProfessional,
  mrrCents,
  percentChange,
  revenueByDay,
  revenueBetween,
} from "@/domain/metrics";

const order = (closedAt: string, amount: number, status: Order["status"] = "closed"): Order => ({
  id: closedAt,
  clientId: "c1",
  professionalId: "pro-1",
  appointmentId: null,
  status,
  items: [
    {
      id: "i",
      kind: "service",
      refId: "svc-1",
      name: "Corte",
      quantity: 1,
      unitPriceCents: amount,
      discountCents: 0,
      clubCovered: false,
      professionalId: "pro-1",
    },
  ],
  discountCents: 0,
  payments: [],
  openedAt: closedAt,
  closedAt,
  cashSessionId: null,
});

const orders = [
  order("2026-11-23T15:00:00.000Z", 4500),
  order("2026-11-24T15:00:00.000Z", 3000),
  order("2026-11-24T16:00:00.000Z", 9999, "open"),
];

describe("metrics", () => {
  it("faturamento só de comandas fechadas no intervalo", () => {
    expect(revenueBetween(orders, "2026-11-24T03:00:00.000Z", "2026-11-25T03:00:00.000Z")).toBe(3000);
    expect(revenueByDay(orders, ["2026-11-23", "2026-11-24"])).toEqual([
      { date: "2026-11-23", cents: 4500 },
      { date: "2026-11-24", cents: 3000 },
    ]);
  });

  it("ticket médio e variação", () => {
    expect(averageTicketCents(orders)).toBe(3750);
    expect(averageTicketCents([])).toBe(0);
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(10, 0)).toBeNull();
  });

  it("MRR soma assinaturas ativas", () => {
    const plans = [{ id: "p1", priceCents: 9900 }, { id: "p2", priceCents: 14900 }] as Plan[];
    const subs = [
      { planId: "p1", status: "active" },
      { planId: "p2", status: "active" },
      { planId: "p2", status: "canceled" },
      { planId: "p1", status: "past_due" },
    ] as Subscription[];
    expect(mrrCents(subs, plans)).toBe(24800);
  });

  it("aniversariantes no intervalo, inclusive virada do ano", () => {
    const clients = [
      { id: "a", birthday: "1990-11-26" },
      { id: "b", birthday: "1985-01-02" },
      { id: "c", birthday: null },
      { id: "d", birthday: "2000-12-10" },
    ] as Client[];
    expect(birthdaysBetween(clients, "2026-11-24", "2026-11-30").map((c) => c.id)).toEqual(["a"]);
    expect(birthdaysBetween(clients, "2026-12-29", "2027-01-04").map((c) => c.id)).toEqual(["b"]);
  });

  it("clientes sumidos: último atendimento há mais de N dias", () => {
    const clients = [{ id: "a" }, { id: "b" }, { id: "c" }] as Client[];
    const apts = [
      { clientId: "a", status: "done", start: "2026-09-01T15:00:00.000Z" },
      { clientId: "b", status: "done", start: "2026-11-20T15:00:00.000Z" },
      { clientId: "a", status: "canceled", start: "2026-11-20T15:00:00.000Z" },
    ] as Appointment[];
    const lapsed = lapsedClients(clients, apts, "2026-11-24", 45);
    expect(lapsed.map((l) => [l.client.id, l.lastVisit])).toEqual([["a", "2026-09-01"]]);
  });

  it("estoque baixo e agrupamento", () => {
    const products = [
      { id: "a", stock: 2, minStock: 3, active: true },
      { id: "b", stock: 9, minStock: 3, active: true },
      { id: "c", stock: 0, minStock: 3, active: false },
    ] as Product[];
    expect(lowStock(products).map((p) => p.id)).toEqual(["a"]);
    expect(
      groupSum(
        [
          { k: "x", v: 1 },
          { k: "y", v: 5 },
          { k: "x", v: 2 },
        ],
        (r) => r.k,
        (r) => r.v,
      ),
    ).toEqual([
      { key: "y", total: 5 },
      { key: "x", total: 3 },
    ]);
  });

  it("ocupação = minutos ocupados / minutos de trabalho, ignorando cancelados e faltas", () => {
    const shop = {
      closures: [],
      hours: [{ weekday: 2, ranges: [{ start: "09:00", end: "19:00" }] }],
    } as unknown as Parameters<typeof occupancyByProfessional>[1];
    const pro = {
      id: "pro-1",
      name: "Rafael",
      active: true,
      serviceIds: ["svc-1"],
      hours: [{ weekday: 2, ranges: [{ start: "09:00", end: "14:00" }] }],
    } as unknown as Parameters<typeof occupancyByProfessional>[2][number];
    const apt = (start: string, end: string, status: Appointment["status"]) =>
      ({ professionalId: "pro-1", start, end, status }) as Appointment;
    const result = occupancyByProfessional(
      [
        apt("2026-11-24T12:00:00.000Z", "2026-11-24T13:00:00.000Z", "done"),
        apt("2026-11-24T13:00:00.000Z", "2026-11-24T14:00:00.000Z", "scheduled"),
        apt("2026-11-24T14:00:00.000Z", "2026-11-24T15:00:00.000Z", "canceled"),
      ],
      shop,
      [pro],
      ["2026-11-24"],
    );
    expect(result).toEqual([{ professionalId: "pro-1", name: "Rafael", pct: 40 }]);
  });

  it("indicadores do Clube no mês", () => {
    const plans = [{ id: "p1", priceCents: 10000 }] as Plan[];
    const sub = (over: Partial<Subscription>) =>
      ({
        planId: "p1",
        status: "active",
        startedAt: "2026-06-01T12:00:00.000Z",
        canceledAt: null,
        ...over,
      }) as Subscription;
    const result = clubIndicators(
      [
        sub({}),
        sub({ startedAt: "2026-11-10T12:00:00.000Z" }),
        sub({ status: "canceling", canceledAt: "2026-11-05T12:00:00.000Z" }),
        sub({ status: "canceled", canceledAt: "2026-10-05T12:00:00.000Z" }),
        sub({ status: "past_due" }),
      ],
      plans,
      "2026-11-01T03:00:00.000Z",
    );
    expect(result).toEqual({ active: 3, mrrCents: 30000, newThisMonth: 1, canceledThisMonth: 1, pastDue: 1 });
  });

  it("estatísticas por cliente: visitas concluídas, última visita e total gasto", () => {
    const apts = [
      { clientId: "c1", status: "done", start: "2026-10-01T15:00:00.000Z" },
      { clientId: "c1", status: "done", start: "2026-11-20T15:00:00.000Z" },
      { clientId: "c1", status: "no_show", start: "2026-11-22T15:00:00.000Z" },
    ] as Appointment[];
    const stats = clientStats(apts, orders);
    expect(stats.get("c1")).toEqual({ visits: 2, lastVisit: "2026-11-20", spentCents: 7500 });
    expect(stats.get("outro")).toBeUndefined();
  });
});

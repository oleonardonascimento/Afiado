import { describe, expect, it } from "vitest";
import type {
  Appointment,
  Client,
  Order,
  OrderItem,
  Subscription,
} from "@/domain/entities";
import {
  activeSubscribersAt,
  closedOrdersBetween,
  newClientsBySource,
  retention,
  revenueByPaymentMethod,
  revenueByProfessional,
  topServices,
} from "@/domain/reports";

const item = (over: Partial<OrderItem>): OrderItem => ({
  id: "i",
  kind: "service",
  refId: "svc-1",
  name: "Corte",
  quantity: 1,
  unitPriceCents: 4500,
  discountCents: 0,
  clubCovered: false,
  professionalId: "pro-1",
  ...over,
});

const order = (over: Partial<Order>): Order => ({
  id: "o",
  clientId: "c1",
  professionalId: "pro-1",
  appointmentId: null,
  status: "closed",
  items: [item({})],
  discountCents: 0,
  payments: [{ method: "pix", amountCents: 4500 }],
  openedAt: "2026-11-10T10:00:00-03:00",
  closedAt: "2026-11-10T10:40:00-03:00",
  cashSessionId: null,
  ...over,
});

const visit = (
  clientId: string,
  date: string,
  status: Appointment["status"] = "done",
): Appointment => ({
  id: `${clientId}-${date}`,
  clientId,
  professionalId: "pro-1",
  serviceIds: ["svc-1"],
  start: `${date}T10:00:00-03:00`,
  end: `${date}T10:30:00-03:00`,
  status,
  priceCents: 4500,
  note: "",
  origin: "panel",
  createdAt: `${date}T09:00:00-03:00`,
  canceledAt: null,
  orderId: null,
});

describe("reports", () => {
  it("filtra comandas fechadas pelo dia do fechamento (inclusive)", () => {
    const list = [
      order({ id: "a", closedAt: "2026-11-01T09:00:00-03:00" }),
      order({ id: "b", closedAt: "2026-11-30T20:00:00-03:00" }),
      order({ id: "c", status: "open", closedAt: null }),
      order({ id: "d", closedAt: "2026-12-01T09:00:00-03:00" }),
    ];
    expect(
      closedOrdersBetween(list, "2026-11-01", "2026-11-30").map((o) => o.id),
    ).toEqual(["a", "b"]);
  });

  it("por forma de pagamento desconta o troco do dinheiro", () => {
    const rows = revenueByPaymentMethod([
      order({ payments: [{ method: "cash", amountCents: 5000 }] }),
      order({
        payments: [
          { method: "pix", amountCents: 2000 },
          { method: "credit", amountCents: 2500 },
        ],
      }),
    ]);
    expect(rows).toEqual({ cash: 4500, pix: 2000, debit: 0, credit: 2500 });
  });

  it("por barbeiro soma os itens (depois do desconto do item)", () => {
    const rows = revenueByProfessional([
      order({
        items: [
          item({
            professionalId: "a",
            unitPriceCents: 4500,
            discountCents: 500,
          }),
          item({
            professionalId: "b",
            kind: "product",
            unitPriceCents: 3000,
            quantity: 2,
          }),
          item({ professionalId: "a", clubCovered: true }),
        ],
      }),
    ]);
    expect(rows).toEqual([
      { key: "b", total: 6000 },
      { key: "a", total: 4000 },
    ]);
  });

  it("serviços mais vendidos contam atendimentos do Clube e somam faturamento", () => {
    const rows = topServices(
      [
        order({
          items: [
            item({ refId: "corte" }),
            item({ refId: "barba", unitPriceCents: 3000 }),
          ],
        }),
        order({
          items: [
            item({ refId: "corte", clubCovered: true }),
            item({ kind: "product", refId: "pomada" }),
          ],
        }),
      ],
      5,
    );
    expect(rows).toEqual([
      { serviceId: "corte", count: 2, cents: 4500 },
      { serviceId: "barba", count: 1, cents: 3000 },
    ]);
  });

  it("retenção: dos clientes que já tinham vindo antes, quantos voltaram dentro do prazo", () => {
    const apts = [
      visit("a", "2026-10-20"),
      visit("a", "2026-11-05"), // voltou 16 dias depois
      visit("b", "2026-09-15"),
      visit("b", "2026-11-03"), // voltou 49 dias depois
      visit("c", "2026-06-01"),
      visit("c", "2026-11-10"), // voltou depois de 162 dias
      visit("d", "2026-11-12"), // cliente novo: fora da conta
      visit("e", "2026-10-30"),
      visit("e", "2026-11-04", "no_show"), // falta não conta como visita
    ];
    expect(retention(apts, "2026-11-01", "2026-11-30", 30)).toEqual({ eligible: 3, returned: 1, pct: 33 });
    expect(retention(apts, "2026-11-01", "2026-11-30", 60)).toEqual({ eligible: 3, returned: 2, pct: 67 });
    expect(retention([], "2026-11-01", "2026-11-30", 30)).toEqual({ eligible: 0, returned: 0, pct: null });
  });

  it("assinantes ativos numa data: começou antes e não foi encerrado", () => {
    const sub = (over: Partial<Subscription>): Subscription => ({
      id: "s",
      clientId: "c",
      planId: "p",
      status: "active",
      paymentMethod: "pix",
      startedAt: "2026-09-10T10:00:00-03:00",
      currentPeriodStart: "2026-11-10T10:00:00-03:00",
      currentPeriodEnd: "2026-12-10T10:00:00-03:00",
      canceledAt: null,
      ...over,
    });
    const subs = [
      sub({}),
      sub({ startedAt: "2026-11-05T10:00:00-03:00" }),
      sub({ status: "canceled", canceledAt: "2026-10-15T10:00:00-03:00" }),
      sub({ status: "canceling", canceledAt: "2026-10-20T10:00:00-03:00" }),
    ];
    expect(activeSubscribersAt(subs, "2026-09-30")).toBe(3);
    expect(activeSubscribersAt(subs, "2026-10-31")).toBe(2);
    expect(activeSubscribersAt(subs, "2026-11-30")).toBe(3);
  });

  it("novos clientes por origem no período, sem origem como 'none'", () => {
    const client = (source: Client["source"], createdAt: string) =>
      ({ source, createdAt }) as Client;
    const rows = newClientsBySource(
      [
        client("instagram", "2026-11-02T10:00:00-03:00"),
        client("instagram", "2026-11-03T10:00:00-03:00"),
        client(null, "2026-11-04T10:00:00-03:00"),
        client("google", "2026-10-04T10:00:00-03:00"),
      ],
      "2026-11-01",
      "2026-11-30",
    );
    expect(rows).toEqual([
      { key: "instagram", total: 2 },
      { key: "none", total: 1 },
    ]);
  });
});

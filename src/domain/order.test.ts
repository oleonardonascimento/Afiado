import { describe, expect, it } from "vitest";
import type { Order, OrderItem, Plan } from "@/domain/entities";
import {
  applyClubBenefit,
  closeOrderProblem,
  orderTotals,
} from "@/domain/order";

const item = (over: Partial<OrderItem>): OrderItem => ({
  id: "it-1",
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
  id: "ord-1",
  clientId: "cli-1",
  professionalId: "pro-1",
  appointmentId: null,
  status: "open",
  items: [],
  discountCents: 0,
  payments: [],
  openedAt: "2026-11-24T13:00:00.000Z",
  closedAt: null,
  cashSessionId: null,
  ...over,
});

describe("orderTotals", () => {
  it("soma itens, separa Clube e descontos", () => {
    const t = orderTotals(
      order({
        items: [
          item({ id: "a", clubCovered: true }),
          item({
            id: "b",
            refId: "svc-2",
            unitPriceCents: 3500,
            discountCents: 500,
          }),
          item({
            id: "c",
            kind: "product",
            refId: "prd-1",
            quantity: 2,
            unitPriceCents: 3000,
          }),
        ],
        discountCents: 1000,
      }),
    );
    expect(t.grossCents).toBe(4500 + 3500 + 6000);
    expect(t.clubCents).toBe(4500);
    expect(t.itemDiscountCents).toBe(500);
    expect(t.totalCents).toBe(3000 + 6000 - 1000);
  });

  it("calcula falta e troco só com dinheiro", () => {
    const base = order({ items: [item({})] });
    expect(
      orderTotals({ ...base, payments: [{ method: "pix", amountCents: 2000 }] })
        .remainingCents,
    ).toBe(2500);
    const cash = orderTotals({
      ...base,
      payments: [{ method: "cash", amountCents: 5000 }],
    });
    expect(cash.remainingCents).toBe(0);
    expect(cash.changeCents).toBe(500);
  });

  it("desconto total não deixa o total negativo", () => {
    expect(
      orderTotals(order({ items: [item({})], discountCents: 9999 })).totalCents,
    ).toBe(0);
  });
});

describe("closeOrderProblem", () => {
  const paid = order({
    items: [item({})],
    payments: [{ method: "pix", amountCents: 4500 }],
  });
  it("aceita comanda paga com caixa aberto", () => {
    expect(closeOrderProblem(paid, true)).toBeNull();
  });
  it("exige caixa aberto, itens e pagamento completo", () => {
    expect(closeOrderProblem(paid, false)).toMatch(/caixa/i);
    expect(closeOrderProblem(order({}), true)).toMatch(/item/i);
    expect(closeOrderProblem({ ...paid, payments: [] }, true)).toMatch(/Falta/);
  });
  it("não aceita pagar a mais sem dinheiro", () => {
    expect(
      closeOrderProblem(
        { ...paid, payments: [{ method: "pix", amountCents: 5000 }] },
        true,
      ),
    ).toMatch(/troco/i);
  });
  it("não fecha comanda já fechada", () => {
    expect(closeOrderProblem({ ...paid, status: "closed" }, true)).toMatch(
      /fechada/i,
    );
  });
});

describe("applyClubBenefit", () => {
  const plan: Plan = {
    id: "pln-1",
    name: "Corte",
    priceCents: 9900,
    description: "",
    benefits: [{ serviceId: "svc-1", monthlyLimit: 2 }],
    rules: { minDaysBetweenUses: 0, allowedWeekdays: [0, 1, 2, 3, 4, 5, 6] },
    recommended: false,
    active: true,
  };
  it("marca o serviço coberto uma vez e deixa o resto", () => {
    const items = applyClubBenefit(
      [item({ id: "a" }), item({ id: "b" }), item({ id: "c", refId: "svc-2" })],
      plan,
      { byService: {}, lastCoveredDate: null },
      "2026-11-24",
    );
    expect(items.map((i) => i.clubCovered)).toEqual([true, false, false]);
  });
  it("respeita o limite do mês", () => {
    const items = applyClubBenefit(
      [item({})],
      plan,
      { byService: { "svc-1": 2 }, lastCoveredDate: "2026-11-01" },
      "2026-11-24",
    );
    expect(items[0]?.clubCovered).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  commissionForItem,
  commissionSummary,
  itemTotalCents,
} from "@/domain/commission";
import type { OrderItem, Professional } from "@/domain/entities";

const pro = {
  id: "pro-1",
  commissionPct: 40,
  commissionOverrides: { "svc-3": 50 },
  clubCommissionCents: 1500,
} as Pick<
  Professional,
  "id" | "commissionPct" | "commissionOverrides" | "clubCommissionCents"
>;

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

describe("commission", () => {
  it("total do item desconta e não fica negativo", () => {
    expect(itemTotalCents(item({ quantity: 2, discountCents: 1000 }))).toBe(
      8000,
    );
    expect(itemTotalCents(item({ discountCents: 9000 }))).toBe(0);
    expect(itemTotalCents(item({ clubCovered: true }))).toBe(0);
  });

  it("serviço usa % do serviço", () => {
    expect(commissionForItem(item({}), pro, 40)).toEqual({
      kind: "service",
      baseCents: 4500,
      pct: 40,
      amountCents: 1800,
    });
  });

  it("exceção do barbeiro vence o % do serviço", () => {
    expect(
      commissionForItem(
        item({ refId: "svc-3", unitPriceCents: 3500 }),
        pro,
        40,
      ),
    ).toEqual({
      kind: "service",
      baseCents: 3500,
      pct: 50,
      amountCents: 1750,
    });
  });

  it("arredonda para o centavo", () => {
    expect(
      commissionForItem(item({ unitPriceCents: 1555 }), pro, 33).amountCents,
    ).toBe(513);
  });

  it("produto usa % do produto", () => {
    expect(
      commissionForItem(
        item({ kind: "product", refId: "prd-1", unitPriceCents: 5000 }),
        pro,
        10,
      ),
    ).toEqual({ kind: "product", baseCents: 5000, pct: 10, amountCents: 500 });
  });

  it("atendimento pelo Clube paga valor fixo", () => {
    expect(commissionForItem(item({ clubCovered: true }), pro, 40)).toEqual({
      kind: "club",
      baseCents: 0,
      pct: null,
      amountCents: 1500,
    });
  });
});

describe("commissionSummary", () => {
  const base = {
    orderId: "o",
    orderItemId: "i",
    date: "2026-11-02T10:00:00-03:00",
    baseCents: 0,
    pct: null,
  };
  it("soma por tipo e separa pago de a pagar", () => {
    const rows = commissionSummary([
      {
        ...base,
        id: "1",
        professionalId: "a",
        kind: "service",
        amountCents: 1800,
        paidAt: null,
      },
      {
        ...base,
        id: "2",
        professionalId: "a",
        kind: "product",
        amountCents: 500,
        paidAt: "2026-11-03T10:00:00-03:00",
      },
      {
        ...base,
        id: "3",
        professionalId: "a",
        kind: "club",
        amountCents: 1500,
        paidAt: null,
      },
      {
        ...base,
        id: "4",
        professionalId: "b",
        kind: "service",
        amountCents: 1000,
        paidAt: null,
      },
    ]);
    expect(rows.find((r) => r.professionalId === "a")).toEqual({
      professionalId: "a",
      serviceCents: 1800,
      productCents: 500,
      clubCents: 1500,
      totalCents: 3800,
      paidCents: 500,
      toPayCents: 3300,
    });
    expect(rows.find((r) => r.professionalId === "b")?.toPayCents).toBe(1000);
  });
});

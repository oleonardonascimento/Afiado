import { describe, expect, it } from "vitest";
import { cashExpected, cashDifference } from "@/domain/cash";
import type { CashMovement } from "@/domain/entities";

const mov = (over: Partial<CashMovement>): CashMovement => ({
  id: "m",
  sessionId: "cash-1",
  kind: "order",
  method: "cash",
  amountCents: 1000,
  description: "",
  orderId: null,
  createdAt: "2026-11-24T13:00:00.000Z",
  ...over,
});

describe("cash", () => {
  const movements = [
    mov({ amountCents: 4500 }),
    mov({ method: "pix", amountCents: 7000 }),
    mov({ kind: "income", amountCents: 1000 }),
    mov({ kind: "expense", amountCents: 3500 }),
    mov({ kind: "withdrawal", amountCents: 5000 }),
    mov({ sessionId: "outro", amountCents: 99999 }),
  ];

  it("esperado = abertura + entradas − saídas, por forma, só da sessão", () => {
    const expected = cashExpected(
      { id: "cash-1", openingCents: 20000 },
      movements,
    );
    expect(expected).toEqual({
      cash: 20000 + 4500 + 1000 - 3500 - 5000,
      pix: 7000,
      debit: 0,
      credit: 0,
    });
  });

  it("diferença contado − esperado, por forma e total", () => {
    const diff = cashDifference(
      { cash: 17000, pix: 7000, debit: 0, credit: 0 },
      { cash: 16800, pix: 7000, debit: 0, credit: 100 },
    );
    expect(diff.byMethod).toEqual({
      cash: -200,
      pix: 0,
      debit: 0,
      credit: 100,
    });
    expect(diff.totalCents).toBe(-100);
  });
});

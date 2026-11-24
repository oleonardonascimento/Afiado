import { describe, expect, it } from "vitest";
import { marginPct, stockAdjustProblem } from "@/domain/product";

describe("product", () => {
  it("ajuste de estoque não pode zerar a operação nem deixar negativo", () => {
    expect(stockAdjustProblem(5, 0)).toMatch(/quantidade/);
    expect(stockAdjustProblem(5, -6)).toMatch(/5 unidades/);
    expect(stockAdjustProblem(5, -5)).toBeNull();
    expect(stockAdjustProblem(5, 10)).toBeNull();
  });
  it("margem sobre o preço de venda, sem dividir por zero", () => {
    expect(marginPct({ priceCents: 5000, costCents: 2000 })).toBe(60);
    expect(marginPct({ priceCents: 0, costCents: 0 })).toBeNull();
  });
});

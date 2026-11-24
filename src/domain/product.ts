/** Regras de produto: ajuste manual de estoque e margem. */
import type { Product } from "@/domain/entities";

/** `delta` positivo = entrada, negativo = saída (perda, uso interno). */
export function stockAdjustProblem(
  stock: number,
  delta: number,
): string | null {
  if (!Number.isInteger(delta) || delta === 0)
    return "Informe uma quantidade diferente de zero.";
  if (stock + delta < 0) return `Só há ${stock} unidades em estoque.`;
  return null;
}

/** Margem bruta em % do preço de venda (arredondada); null sem preço. */
export function marginPct(
  product: Pick<Product, "priceCents" | "costCents">,
): number | null {
  if (product.priceCents <= 0) return null;
  return Math.round(
    ((product.priceCents - product.costCents) / product.priceCents) * 100,
  );
}

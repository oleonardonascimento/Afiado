/**
 * Regras de comissão (PRD §5.4 RF-46, premissa 5):
 * - serviço: % do serviço, com exceção por barbeiro (commissionOverrides[serviceId]);
 * - produto: % do produto;
 * - atendimento coberto pelo Clube: valor fixo por atendimento (clubCommissionCents).
 * Base = quantidade × preço − desconto do item. Arredonda para o centavo.
 */
import type { Commission, OrderItem, Professional } from "@/domain/entities";

type CommissionPro = Pick<Professional, "commissionOverrides" | "clubCommissionCents">;

export type CommissionCalc = Pick<Commission, "kind" | "baseCents" | "pct" | "amountCents">;

export function itemTotalCents(item: OrderItem): number {
  if (item.clubCovered) return 0;
  return Math.max(0, item.quantity * item.unitPriceCents - item.discountCents);
}

/** `catalogPct` é o % cadastrado no serviço ou produto do item. */
export function commissionForItem(
  item: OrderItem,
  pro: CommissionPro,
  catalogPct: number,
): CommissionCalc {
  if (item.kind === "service" && item.clubCovered) {
    return { kind: "club", baseCents: 0, pct: null, amountCents: pro.clubCommissionCents };
  }
  const baseCents = itemTotalCents(item);
  const pct =
    item.kind === "service" ? (pro.commissionOverrides[item.refId] ?? catalogPct) : catalogPct;
  return {
    kind: item.kind,
    baseCents,
    pct,
    amountCents: Math.round((baseCents * pct) / 100),
  };
}

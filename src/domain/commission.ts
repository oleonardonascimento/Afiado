/**
 * Regras de comissão (PRD §5.4 RF-46, premissa 5):
 * - serviço: % do serviço, com exceção por barbeiro (commissionOverrides[serviceId]);
 * - produto: % do produto;
 * - atendimento coberto pelo Clube: valor fixo por atendimento (clubCommissionCents).
 * Base = quantidade × preço − desconto do item. Arredonda para o centavo.
 */
import type { Commission, OrderItem, Professional } from "@/domain/entities";

type CommissionPro = Pick<
  Professional,
  "commissionOverrides" | "clubCommissionCents"
>;

export type CommissionCalc = Pick<
  Commission,
  "kind" | "baseCents" | "pct" | "amountCents"
>;

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
    return {
      kind: "club",
      baseCents: 0,
      pct: null,
      amountCents: pro.clubCommissionCents,
    };
  }
  const baseCents = itemTotalCents(item);
  const pct =
    item.kind === "service"
      ? (pro.commissionOverrides[item.refId] ?? catalogPct)
      : catalogPct;
  return {
    kind: item.kind,
    baseCents,
    pct,
    amountCents: Math.round((baseCents * pct) / 100),
  };
}

export type CommissionSummary = {
  professionalId: string;
  serviceCents: number;
  productCents: number;
  clubCents: number;
  totalCents: number;
  paidCents: number;
  toPayCents: number;
};

/** Resumo por barbeiro: serviços, produtos, Clube, total, pago e a pagar. */
export function commissionSummary(
  commissions: Commission[],
): CommissionSummary[] {
  const map = new Map<string, CommissionSummary>();
  for (const c of commissions) {
    const row = map.get(c.professionalId) ?? {
      professionalId: c.professionalId,
      serviceCents: 0,
      productCents: 0,
      clubCents: 0,
      totalCents: 0,
      paidCents: 0,
      toPayCents: 0,
    };
    if (c.kind === "service") row.serviceCents += c.amountCents;
    else if (c.kind === "product") row.productCents += c.amountCents;
    else row.clubCents += c.amountCents;
    row.totalCents += c.amountCents;
    if (c.paidAt) row.paidCents += c.amountCents;
    else row.toPayCents += c.amountCents;
    map.set(c.professionalId, row);
  }
  return [...map.values()];
}

/**
 * Comanda (PRD A5, RF-30..34): totais, troco, validação de fechamento e benefício do Clube.
 * Valores em centavos. Troco só existe quando há pagamento em dinheiro.
 */
import { itemTotalCents } from "@/domain/commission";
import type { Order, OrderItem, Plan } from "@/domain/entities";
import { coveredServiceIds, type PlanUsage } from "@/domain/subscription";
import { formatBRL } from "@/lib/format";

export type OrderTotals = {
  /** Soma de quantidade × preço de todos os itens. */
  grossCents: number;
  /** Valor dos itens cobertos pelo Clube. */
  clubCents: number;
  itemDiscountCents: number;
  orderDiscountCents: number;
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  changeCents: number;
};

export function orderTotals(
  order: Pick<Order, "items" | "discountCents" | "payments">,
): OrderTotals {
  let grossCents = 0;
  let clubCents = 0;
  let itemDiscountCents = 0;
  let itemsCents = 0;
  for (const item of order.items) {
    const gross = item.quantity * item.unitPriceCents;
    grossCents += gross;
    if (item.clubCovered) clubCents += gross;
    else itemDiscountCents += Math.min(item.discountCents, gross);
    itemsCents += itemTotalCents(item);
  }
  const orderDiscountCents = Math.min(order.discountCents, itemsCents);
  const totalCents = itemsCents - orderDiscountCents;
  const paidCents = order.payments.reduce((sum, p) => sum + p.amountCents, 0);
  const cashCents = order.payments
    .filter((p) => p.method === "cash")
    .reduce((s, p) => s + p.amountCents, 0);
  const over = Math.max(0, paidCents - totalCents);
  return {
    grossCents,
    clubCents,
    itemDiscountCents,
    orderDiscountCents,
    totalCents,
    paidCents,
    remainingCents: Math.max(0, totalCents - paidCents),
    changeCents: Math.min(over, cashCents),
  };
}

/** Motivo que impede fechar a comanda, em pt-BR; null quando pode fechar. */
export function closeOrderProblem(
  order: Order,
  cashOpen: boolean,
): string | null {
  if (order.status !== "open") return "Esta comanda já está fechada.";
  if (!cashOpen)
    return "O caixa está fechado. Abra o caixa para fechar comandas.";
  if (order.items.length === 0) return "Adicione pelo menos um item à comanda.";
  const t = orderTotals(order);
  if (t.remainingCents > 0)
    return `Falta receber ${formatBRL(t.remainingCents)}.`;
  if (t.paidCents - t.totalCents > t.changeCents) {
    return "O valor pago passa do total e só pagamento em dinheiro gera troco. Ajuste os valores.";
  }
  return null;
}

/** Marca como cobertos pelo Clube os serviços que o plano cobre hoje (1 de cada). */
export function applyClubBenefit(
  items: OrderItem[],
  plan: Plan,
  usage: PlanUsage,
  date: string,
): OrderItem[] {
  const serviceIds = items
    .filter((i) => i.kind === "service")
    .map((i) => i.refId);
  const covered = new Set(coveredServiceIds(plan, usage, serviceIds, date));
  return items.map((item) => {
    const hit = item.kind === "service" && covered.has(item.refId);
    if (hit) covered.delete(item.refId);
    return {
      ...item,
      clubCovered: hit,
      discountCents: hit ? 0 : item.discountCents,
    };
  });
}

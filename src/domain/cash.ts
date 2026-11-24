/**
 * Caixa (PRD A6, RF-40..43): valor esperado por forma de pagamento e diferença no fechamento.
 * Esperado = abertura (só dinheiro) + comandas e entradas − saídas e sangrias.
 */
import {
  PAYMENT_METHODS,
  type CashMovement,
  type CashSession,
  type PaymentMethod,
} from "@/domain/entities";

export type ByMethod = Record<PaymentMethod, number>;

export function emptyByMethod(): ByMethod {
  return { cash: 0, pix: 0, debit: 0, credit: 0 };
}

export function cashExpected(
  session: Pick<CashSession, "id" | "openingCents">,
  movements: CashMovement[],
): ByMethod {
  const expected = emptyByMethod();
  expected.cash = session.openingCents;
  for (const m of movements) {
    if (m.sessionId !== session.id) continue;
    const sign = m.kind === "order" || m.kind === "income" ? 1 : -1;
    expected[m.method] += sign * m.amountCents;
  }
  return expected;
}

export function cashDifference(
  expected: ByMethod,
  counted: ByMethod,
): {
  byMethod: ByMethod;
  totalCents: number;
  mismatched: PaymentMethod[];
  matches: boolean;
} {
  const byMethod = emptyByMethod();
  let totalCents = 0;
  for (const method of PAYMENT_METHODS) {
    byMethod[method] = counted[method] - expected[method];
    totalCents += byMethod[method];
  }
  // Confere só se cada forma bate: sobra no Pix não compensa falta na gaveta.
  const mismatched = PAYMENT_METHODS.filter((m) => byMethod[m] !== 0);
  return { byMethod, totalCents, mismatched, matches: mismatched.length === 0 };
}

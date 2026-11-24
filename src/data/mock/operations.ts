/** Comanda, caixa, Clube e comissões no mock — a V2 faz o mesmo no servidor. */
import { addMonths as addMonthsDate } from "date-fns";
import {
  NotFoundError,
  OperationError,
  type NewMovement,
} from "@/data/repositories";
import type { MockStore } from "@/data/mock/store";
import { commissionForItem } from "@/domain/commission";
import type {
  CashMovement,
  CashSession,
  DbSnapshot,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  Subscription,
} from "@/domain/entities";
import {
  applyClubBenefit,
  closeOrderProblem,
  orderTotals,
} from "@/domain/order";
import { isSubscriptionActive, planUsage } from "@/domain/subscription";
import { todayIn } from "@/lib/calendar";

const uid = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();

export function openCashSession(db: DbSnapshot): CashSession | undefined {
  return db.cashSessions.find((s) => s.closedAt === null);
}

function activeSubscription(
  db: DbSnapshot,
  clientId: string | null,
): Subscription | undefined {
  if (!clientId) return undefined;
  return db.subscriptions.find(
    (s) => s.clientId === clientId && isSubscriptionActive(s, new Date()),
  );
}

/** Cobertura do Clube recalculada com o uso já fechado; sem assinatura, nada fica coberto. */
function recheckClub(
  db: DbSnapshot,
  clientId: string | null,
  items: OrderItem[],
): OrderItem[] {
  const sub = activeSubscription(db, clientId);
  const plan = sub && db.plans.find((p) => p.id === sub.planId);
  if (!sub || !plan) return items.map((i) => ({ ...i, clubCovered: false }));
  return applyClubBenefit(
    items,
    plan,
    planUsage(sub, db.orders),
    todayIn(new Date()),
  );
}

export function openOrderFromAppointment(
  store: MockStore,
  appointmentId: string,
): Order {
  const db = store.read();
  const apt = db.appointments.find((a) => a.id === appointmentId);
  if (!apt) throw new NotFoundError(`appointments/${appointmentId}`);
  const existing = apt.orderId
    ? db.orders.find((o) => o.id === apt.orderId)
    : undefined;
  if (existing && existing.status !== "canceled") return existing;
  if (apt.status === "canceled" || apt.status === "no_show") {
    throw new OperationError(
      "Este agendamento foi cancelado ou marcado como falta.",
    );
  }
  const items: OrderItem[] = apt.serviceIds.map((serviceId) => {
    const service = db.services.find((s) => s.id === serviceId);
    return {
      id: uid(),
      kind: "service",
      refId: serviceId,
      name: service?.name ?? "Serviço",
      quantity: 1,
      unitPriceCents: service?.priceCents ?? 0,
      discountCents: 0,
      clubCovered: false,
      professionalId: apt.professionalId,
    };
  });
  const order: Order = {
    id: uid(),
    clientId: apt.clientId,
    professionalId: apt.professionalId,
    appointmentId: apt.id,
    status: "open",
    items: recheckClub(db, apt.clientId, items),
    discountCents: 0,
    payments: [],
    openedAt: nowIso(),
    closedAt: null,
    cashSessionId: null,
  };
  store.write((d) => {
    d.orders.push(order);
    const target = d.appointments.find((a) => a.id === appointmentId);
    if (target) {
      target.status = "done";
      target.orderId = order.id;
    }
  });
  return order;
}

export function openWalkInOrder(
  store: MockStore,
  clientId: string | null,
  professionalId: string,
): Order {
  const order: Order = {
    id: uid(),
    clientId,
    professionalId,
    appointmentId: null,
    status: "open",
    items: [],
    discountCents: 0,
    payments: [],
    openedAt: nowIso(),
    closedAt: null,
    cashSessionId: null,
  };
  store.write((d) => {
    d.orders.push(order);
  });
  return order;
}

export function closeOrder(
  store: MockStore,
  id: string,
  payments: Payment[],
): Order {
  const db = store.read();
  const current = db.orders.find((o) => o.id === id);
  if (!current) throw new NotFoundError(`orders/${id}`);
  const session = openCashSession(db);
  const items = recheckClub(db, current.clientId, current.items);
  if (
    items.some((item, i) => item.clubCovered !== current.items[i]?.clubCovered)
  ) {
    store.write((d) => {
      const order = d.orders.find((o) => o.id === id);
      if (order) order.items = items;
    });
    throw new OperationError(
      "O benefício do Clube mudou (já foi usado em outra comanda ou a assinatura não vale). Os valores foram atualizados: confira o pagamento e feche de novo.",
    );
  }
  const candidate: Order = {
    ...current,
    payments: payments.filter((p) => p.amountCents > 0),
  };
  const problem = closeOrderProblem(candidate, Boolean(session));
  if (problem || !session)
    throw new OperationError(problem ?? "O caixa está fechado.");
  const totals = orderTotals(candidate);
  const closedAt = nowIso();

  store.write((d) => {
    const order = d.orders.find((o) => o.id === id);
    if (!order) return;
    order.payments = candidate.payments;
    order.status = "closed";
    order.closedAt = closedAt;
    order.cashSessionId = session.id;

    let change = totals.changeCents;
    for (const payment of candidate.payments) {
      let amount = payment.amountCents;
      if (payment.method === "cash" && change > 0) {
        const used = Math.min(change, amount);
        amount -= used;
        change -= used;
      }
      if (amount === 0) continue;
      d.cashMovements.push({
        id: uid(),
        sessionId: session.id,
        kind: "order",
        method: payment.method,
        amountCents: amount,
        description: "Comanda",
        orderId: order.id,
        createdAt: closedAt,
      });
    }

    for (const item of order.items) {
      const pro = d.professionals.find((p) => p.id === item.professionalId);
      if (!pro) continue;
      const catalogPct =
        item.kind === "service"
          ? (d.services.find((s) => s.id === item.refId)?.commissionPct ?? 0)
          : (d.products.find((p) => p.id === item.refId)?.commissionPct ?? 0);
      d.commissions.push({
        id: uid(),
        professionalId: pro.id,
        orderId: order.id,
        orderItemId: item.id,
        date: closedAt,
        ...commissionForItem(item, pro, catalogPct),
        paidAt: null,
      });
      if (item.kind === "product") {
        const product = d.products.find((p) => p.id === item.refId);
        if (product) product.stock -= item.quantity;
      }
    }
  });
  return store.read().orders.find((o) => o.id === id) as Order;
}

export function cancelOrder(store: MockStore, id: string): Order {
  const db = store.read();
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw new NotFoundError(`orders/${id}`);
  if (order.status !== "open")
    throw new OperationError("Só comandas abertas podem ser canceladas.");
  store.write((d) => {
    const target = d.orders.find((o) => o.id === id);
    if (target) target.status = "canceled";
    const apt = order.appointmentId
      ? d.appointments.find((a) => a.id === order.appointmentId)
      : undefined;
    if (apt && apt.orderId === id) {
      apt.status = "in_service";
      apt.orderId = null;
    }
  });
  return { ...order, status: "canceled" };
}

export function openCash(
  store: MockStore,
  openingCents: number,
  staffId: string,
): CashSession {
  if (openCashSession(store.read()))
    throw new OperationError("Já existe um caixa aberto.");
  const session: CashSession = {
    id: uid(),
    openedAt: nowIso(),
    openedBy: staffId,
    openingCents,
    closedAt: null,
    counted: null,
    note: "",
  };
  store.write((d) => {
    d.cashSessions.push(session);
  });
  return session;
}

export function addCashMovement(
  store: MockStore,
  input: NewMovement,
): CashMovement {
  const session = openCashSession(store.read());
  if (!session)
    throw new OperationError(
      "O caixa está fechado. Abra o caixa para lançar movimentos.",
    );
  if (input.amountCents <= 0)
    throw new OperationError("Informe um valor maior que zero.");
  const movement: CashMovement = {
    id: uid(),
    sessionId: session.id,
    orderId: null,
    createdAt: nowIso(),
    ...input,
  };
  store.write((d) => {
    d.cashMovements.push(movement);
  });
  return movement;
}

export function closeCash(
  store: MockStore,
  id: string,
  counted: Record<PaymentMethod, number>,
  note: string,
): CashSession {
  const db = store.read();
  const session = db.cashSessions.find((s) => s.id === id);
  if (!session) throw new NotFoundError(`cashSessions/${id}`);
  if (session.closedAt) throw new OperationError("Este caixa já foi fechado.");
  const closedAt = nowIso();
  store.write((d) => {
    const target = d.cashSessions.find((s) => s.id === id);
    if (!target) return;
    target.closedAt = closedAt;
    target.counted = { ...counted };
    target.note = note.trim();
  });
  return { ...session, closedAt, counted: { ...counted }, note: note.trim() };
}

export function subscribe(
  store: MockStore,
  input: { clientId: string; planId: string; paymentMethod: "pix" | "card" },
): Subscription {
  const db = store.read();
  if (activeSubscription(db, input.clientId)) {
    throw new OperationError("Você já tem uma assinatura do Clube ativa.");
  }
  const plan = db.plans.find((p) => p.id === input.planId && p.active);
  if (!plan) throw new OperationError("Este plano não está mais disponível.");
  const now = new Date();
  const subscription: Subscription = {
    id: uid(),
    clientId: input.clientId,
    planId: plan.id,
    status: "active",
    paymentMethod: input.paymentMethod,
    startedAt: now.toISOString(),
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: addMonthsDate(now, 1).toISOString(),
    canceledAt: null,
  };
  store.write((d) => {
    d.subscriptions.push(subscription);
    d.charges.push({
      id: uid(),
      subscriptionId: subscription.id,
      amountCents: plan.priceCents,
      dueDate: todayIn(now),
      status: "paid",
      paidAt: now.toISOString(),
    });
  });
  return subscription;
}

export function cancelSubscription(store: MockStore, id: string): Subscription {
  const sub = store.read().subscriptions.find((s) => s.id === id);
  if (!sub) throw new NotFoundError(`subscriptions/${id}`);
  if (sub.status === "canceled" || sub.status === "canceling") return sub;
  const canceledAt = nowIso();
  store.write((d) => {
    const target = d.subscriptions.find((s) => s.id === id);
    if (!target) return;
    target.status = "canceling";
    target.canceledAt = canceledAt;
  });
  return { ...sub, status: "canceling", canceledAt };
}

export function markCommissionsPaid(store: MockStore, ids: string[]) {
  const paidAt = nowIso();
  const set = new Set(ids);
  store.write((d) => {
    for (const c of d.commissions)
      if (set.has(c.id) && !c.paidAt) c.paidAt = paidAt;
  });
}

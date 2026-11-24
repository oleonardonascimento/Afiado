import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperationError, type Repositories } from "@/data/repositories";
import { createEmptySnapshot } from "@/data/mock/empty-snapshot";
import { createMockRepositories } from "@/data/mock/repositories";
import {
  plans,
  products,
  professionals,
  services,
  shop,
} from "@/data/mock/seed-catalog";
import { createStore } from "@/data/mock/store";

const NOW = new Date("2026-11-26T13:00:00.000Z");
let repos: Repositories;

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  const seed = () => {
    const db = createEmptySnapshot();
    db.shop = structuredClone(shop);
    db.professionals = structuredClone(professionals);
    db.services = structuredClone(services);
    db.products = structuredClone(products);
    db.plans = structuredClone(plans);
    db.clients.push({
      id: "cli-1",
      name: "Ana Souza",
      phone: "61999998888",
      email: null,
      birthday: null,
      source: null,
      notes: "",
      tags: [],
      marketingConsent: false,
      createdAt: "2026-01-01T12:00:00.000Z",
    });
    db.appointments.push({
      id: "apt-1",
      clientId: "cli-1",
      professionalId: "pro-3",
      serviceIds: ["svc-1"],
      start: "2026-11-26T12:00:00.000Z",
      end: "2026-11-26T12:30:00.000Z",
      status: "in_service",
      priceCents: 4500,
      note: "",
      origin: "online",
      createdAt: "2026-11-20T12:00:00.000Z",
      canceledAt: null,
      orderId: null,
    });
    return db;
  };
  repos = createMockRepositories(
    createStore({ storage: null, seed, latency: [0, 0] }),
  );
});

afterEach(() => vi.useRealTimers());

describe("comanda e caixa no mock", () => {
  it("concluir atendimento abre comanda com os serviços (uma vez só)", async () => {
    const order = await repos.orders.openFromAppointment("apt-1");
    expect(order.status).toBe("open");
    expect(order.items.map((i) => i.refId)).toEqual(["svc-1"]);
    const again = await repos.orders.openFromAppointment("apt-1");
    expect(again.id).toBe(order.id);
    const apt = await repos.appointments.get("apt-1");
    expect(apt?.status).toBe("done");
    expect(apt?.orderId).toBe(order.id);
  });

  it("fechar exige caixa aberto", async () => {
    const order = await repos.orders.openFromAppointment("apt-1");
    await expect(
      repos.orders.close(order.id, [{ method: "pix", amountCents: 4500 }]),
    ).rejects.toThrow(OperationError);
  });

  it("fechar gera movimentos (dinheiro líquido do troco), comissões e baixa estoque", async () => {
    const session = await repos.cash.open(20000, "pro-5");
    const order = await repos.orders.openFromAppointment("apt-1");
    const product = products.find((p) => p.id === "prd-1");
    if (!product) throw new Error("seed sem prd-1");
    await repos.orders.update(order.id, {
      items: [
        ...order.items,
        {
          id: "itm-x",
          kind: "product",
          refId: product.id,
          name: product.name,
          quantity: 1,
          unitPriceCents: product.priceCents,
          discountCents: 0,
          clubCovered: false,
          professionalId: "pro-3",
        },
      ],
    });
    const total = 4500 + product.priceCents;
    const closed = await repos.orders.close(order.id, [
      { method: "cash", amountCents: total + 500 },
    ]);
    expect(closed.status).toBe("closed");
    expect(closed.cashSessionId).toBe(session.id);
    const movements = await repos.cashMovements.list();
    expect(movements).toEqual([
      expect.objectContaining({
        kind: "order",
        method: "cash",
        amountCents: total,
      }),
    ]);
    const commissions = await repos.commissions.list();
    expect(commissions).toHaveLength(2);
    expect((await repos.products.get(product.id))?.stock).toBe(
      product.stock - 1,
    );
  });

  it("cancelar comanda do atendimento devolve o agendamento para concluir de novo", async () => {
    const order = await repos.orders.openFromAppointment("apt-1");
    await repos.orders.cancel(order.id);
    const apt = await repos.appointments.get("apt-1");
    expect(apt?.status).toBe("in_service");
    expect(apt?.orderId).toBeNull();
    const reopened = await repos.orders.openFromAppointment("apt-1");
    expect(reopened.id).not.toBe(order.id);
    expect(reopened.status).toBe("open");
  });

  it("não abre dois caixas e fecha com contagem", async () => {
    const session = await repos.cash.open(10000, "pro-5");
    await expect(repos.cash.open(10000, "pro-5")).rejects.toThrow(
      OperationError,
    );
    await repos.cash.addMovement({
      kind: "expense",
      method: "cash",
      amountCents: 2000,
      description: "Café",
    });
    const closed = await repos.cash.close(
      session.id,
      { cash: 8000, pix: 0, debit: 0, credit: 0 },
      "",
    );
    expect(closed.closedAt).not.toBeNull();
    await expect(
      repos.cash.addMovement({
        kind: "income",
        method: "cash",
        amountCents: 1,
        description: "x",
      }),
    ).rejects.toThrow(OperationError);
  });
});

describe("Clube no mock", () => {
  it("assinar cria assinatura ativa e primeira cobrança paga; cancelar mantém até o fim do período", async () => {
    const sub = await repos.subscriptions.subscribe({
      clientId: "cli-1",
      planId: "pln-1",
      paymentMethod: "pix",
    });
    expect(sub.status).toBe("active");
    expect(sub.currentPeriodEnd > sub.currentPeriodStart).toBe(true);
    expect(await repos.charges.list()).toEqual([
      expect.objectContaining({ status: "paid", subscriptionId: sub.id }),
    ]);
    await expect(
      repos.subscriptions.subscribe({
        clientId: "cli-1",
        planId: "pln-2",
        paymentMethod: "pix",
      }),
    ).rejects.toThrow(OperationError);
    const canceled = await repos.subscriptions.cancel(sub.id);
    expect(canceled.status).toBe("canceling");
    expect(canceled.currentPeriodEnd).toBe(sub.currentPeriodEnd);
  });

  it("ao fechar, o benefício é conferido de novo: duas comandas abertas não usam o Clube duas vezes", async () => {
    await repos.cash.open(0, "pro-5");
    await repos.subscriptions.subscribe({
      clientId: "cli-1",
      planId: "pln-1",
      paymentMethod: "pix",
    });
    const first = await repos.orders.openFromAppointment("apt-1");
    const second = await repos.orders.openWalkIn({
      clientId: "cli-1",
      professionalId: "pro-3",
    });
    const covered = { ...first.items[0]!, id: "itm-b", clubCovered: true };
    await repos.orders.update(second.id, { items: [covered] });

    await repos.orders.close(first.id, []);
    await expect(repos.orders.close(second.id, [])).rejects.toThrow(/Clube/);
    const updated = await repos.orders.get(second.id);
    expect(updated?.status).toBe("open");
    expect(updated?.items[0]?.clubCovered).toBe(false);
  });

  it("sem assinatura, item marcado como coberto não fecha de graça", async () => {
    await repos.cash.open(0, "pro-5");
    const order = await repos.orders.openWalkIn({
      clientId: "cli-1",
      professionalId: "pro-3",
    });
    await repos.orders.update(order.id, {
      items: [
        {
          id: "itm-c",
          kind: "service",
          refId: "svc-1",
          name: "Corte",
          quantity: 1,
          unitPriceCents: 4500,
          discountCents: 0,
          clubCovered: true,
          professionalId: "pro-3",
        },
      ],
    });
    await expect(repos.orders.close(order.id, [])).rejects.toThrow(/Clube/);
  });

  it("comanda de assinante já vem com o serviço coberto", async () => {
    await repos.subscriptions.subscribe({
      clientId: "cli-1",
      planId: "pln-1",
      paymentMethod: "card",
    });
    const order = await repos.orders.openFromAppointment("apt-1");
    expect(order.items[0]?.clubCovered).toBe(true);
  });
});

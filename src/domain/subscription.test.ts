import { describe, expect, it } from "vitest";
import { plans, services } from "@/data/mock/seed-catalog";
import type { Order, Subscription } from "@/domain/entities";
import {
  bookingTotals,
  coveredServiceIds,
  isSubscriptionActive,
  planUsage,
} from "@/domain/subscription";

const sub: Subscription = {
  id: "sub-1",
  clientId: "cli-1",
  planId: "pln-2",
  status: "active",
  paymentMethod: "pix",
  startedAt: "2026-08-10T13:00:00.000Z",
  currentPeriodStart: "2026-11-10T03:00:00.000Z",
  currentPeriodEnd: "2026-12-10T03:00:00.000Z",
  canceledAt: null,
};
const plan2 = plans[1]!;

const order = (date: string, refId: string, clubCovered = true): Order => ({
  id: `ord-${date}-${refId}`,
  clientId: "cli-1",
  professionalId: "pro-1",
  appointmentId: null,
  status: "closed",
  items: [
    { id: "i", kind: "service", refId, name: "", quantity: 1, unitPriceCents: 3500, discountCents: 0, clubCovered, professionalId: "pro-1" },
  ],
  discountCents: 0,
  payments: [],
  openedAt: `${date}T13:00:00.000Z`,
  closedAt: `${date}T13:30:00.000Z`,
  cashSessionId: null,
});

describe("subscription", () => {
  it("assinatura ativa e cancelando valem até o fim do período", () => {
    const now = new Date("2026-11-20T12:00:00.000Z");
    expect(isSubscriptionActive(sub, now)).toBe(true);
    expect(isSubscriptionActive({ ...sub, status: "canceling" }, now)).toBe(true);
    expect(isSubscriptionActive({ ...sub, status: "canceling" }, new Date("2026-12-11T12:00:00.000Z"))).toBe(false);
    expect(isSubscriptionActive({ ...sub, status: "past_due" }, now)).toBe(false);
    expect(isSubscriptionActive({ ...sub, status: "canceled" }, now)).toBe(false);
  });

  it("conta o uso do período atual", () => {
    const usage = planUsage(sub, [
      order("2026-11-01", "svc-3"), // período anterior
      order("2026-11-12", "svc-3"),
      order("2026-11-15", "svc-1"),
      order("2026-11-18", "svc-3", false), // pago, não conta
    ]);
    expect(usage.byService).toEqual({ "svc-3": 1, "svc-1": 1 });
    expect(usage.lastCoveredDate).toBe("2026-11-15");
  });

  it("cobre serviços do plano dentro do limite e do intervalo mínimo", () => {
    const usage = { byService: { "svc-3": 4 }, lastCoveredDate: "2026-11-15" };
    expect(coveredServiceIds(plan2, usage, ["svc-1", "svc-3", "svc-7"], "2026-11-23")).toEqual(["svc-1"]);
    expect(coveredServiceIds(plan2, usage, ["svc-1"], "2026-11-20")).toEqual([]); // < 7 dias
    expect(coveredServiceIds(plan2, { byService: {}, lastCoveredDate: null }, ["svc-2"], "2026-11-23")).toEqual([]);
  });

  it("totais somam duração e separam o que sai pelo Clube", () => {
    const chosen = services.filter((s) => ["svc-1", "svc-7"].includes(s.id));
    expect(bookingTotals(chosen, ["svc-1"])).toEqual({
      durationMinutes: 45,
      priceCents: 6000,
      coveredCents: 4500,
      payableCents: 1500,
    });
  });
});

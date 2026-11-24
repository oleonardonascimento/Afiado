import { describe, expect, it } from "vitest";
import { ClientInputSchema, ReviewSchema, ServiceSchema } from "@/domain/entities";

const validService = {
  id: "svc-1",
  name: "Corte",
  category: "corte",
  priceCents: 4500,
  durationMinutes: 30,
  commissionPct: 40,
  onlineBooking: true,
  active: true,
};

const validReview = {
  id: "rev-1",
  appointmentId: "apt-1",
  clientId: "cli-1",
  professionalId: "pro-1",
  rating: 5,
  comment: "Ótimo",
  createdAt: "2026-11-20T15:00:00.000-03:00",
  reply: null,
};

describe("entities", () => {
  it("ClientInputSchema normaliza telefone", () => {
    expect(ClientInputSchema.parse({ name: "Ana", phone: "(61) 99999-8888" }).phone).toBe(
      "61999998888",
    );
  });

  it("ClientInputSchema recusa telefone inválido com mensagem pt-BR", () => {
    expect(ClientInputSchema.safeParse({ name: "Ana", phone: "123" }).error?.issues[0]?.message).toBe(
      "Telefone inválido. Use DDD + número.",
    );
  });

  it("ServiceSchema exige centavos inteiros", () => {
    expect(ServiceSchema.safeParse(validService).success).toBe(true);
    expect(ServiceSchema.safeParse({ ...validService, priceCents: 45.5 }).success).toBe(false);
  });

  it("ReviewSchema limita nota a 1–5", () => {
    expect(ReviewSchema.safeParse(validReview).success).toBe(true);
    expect(ReviewSchema.safeParse({ ...validReview, rating: 6 }).success).toBe(false);
  });
});

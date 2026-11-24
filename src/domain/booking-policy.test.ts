import { describe, expect, it } from "vitest";
import { changePolicy, fillTemplate } from "@/domain/booking-policy";

const start = "2026-11-27T17:00:00.000Z"; // 14h SP

describe("changePolicy", () => {
  it("permite remarcar/cancelar antes do prazo", () => {
    expect(changePolicy({ start, status: "scheduled" }, new Date("2026-11-27T13:00:00.000Z"), 3)).toEqual({ allowed: true });
  });

  it("bloqueia dentro do prazo e explica", () => {
    expect(changePolicy({ start, status: "confirmed" }, new Date("2026-11-27T15:00:00.000Z"), 3)).toEqual({
      allowed: false,
      reason:
        "Faltam menos de 3 horas para o horário. Para remarcar ou cancelar, fale com a barbearia pelo WhatsApp.",
    });
  });

  it("bloqueia atendimento que já aconteceu ou foi cancelado", () => {
    const now = new Date("2026-11-20T13:00:00.000Z");
    for (const status of ["done", "canceled", "no_show", "in_service"] as const) {
      expect(changePolicy({ start, status }, now, 3).allowed).toBe(false);
    }
  });
});

describe("fillTemplate", () => {
  it("troca variáveis conhecidas e mantém o resto", () => {
    expect(fillTemplate("Oi, {nome}! {data} às {hora}. {outro}", { nome: "Ana", data: "sexta, 27/11", hora: "14:00" })).toBe(
      "Oi, Ana! sexta, 27/11 às 14:00. {outro}",
    );
  });
});

import { describe, expect, it } from "vitest";
import { centsToInput, formatBRL, formatDate, formatPhone, formatTime, formatWeekday, parseBRL } from "@/lib/format";

describe("format", () => {
  it("formata moeda em centavos", () => {
    expect(formatBRL(4500)).toBe("R$ 45,00");
    expect(formatBRL(0)).toBe("R$ 0,00");
    expect(formatBRL(123456)).toBe("R$ 1.234,56");
  });

  it("formata data e hora no fuso de São Paulo", () => {
    expect(formatTime("2026-11-27T17:00:00.000Z")).toBe("14:00");
    expect(formatDate("2026-11-27T02:30:00.000Z")).toBe("26/11");
    expect(formatWeekday("2026-11-27T15:00:00.000Z")).toBe("sexta-feira");
  });

  it("formata telefone BR", () => {
    expect(formatPhone("61999998888")).toBe("(61) 99999-8888");
    expect(formatPhone("6133334444")).toBe("(61) 3333-4444");
  });

  it("lê e escreve valor digitado em reais", () => {
    expect(parseBRL("45")).toBe(4500);
    expect(parseBRL("45,5")).toBe(4550);
    expect(parseBRL("R$ 1.234,56")).toBe(123456);
    expect(parseBRL("")).toBeNull();
    expect(parseBRL("abc")).toBeNull();
    expect(parseBRL("-3")).toBeNull();
    expect(centsToInput(4550)).toBe("45,50");
  });
});

import { describe, expect, it } from "vitest";
import { shop } from "@/data/mock/seed-catalog";
import { openStatus, ratingSummary, weeklyHoursProblem } from "@/domain/shop";
import type { Review } from "@/domain/entities";

describe("openStatus", () => {
  it("aberto agora mostra a hora de fechar", () => {
    expect(openStatus(shop, new Date("2026-11-27T15:00:00.000Z"))).toEqual({
      isOpen: true,
      label: "Aberto agora · fecha às 20:00",
    });
  });

  it("fechado mostra quando abre", () => {
    expect(openStatus(shop, new Date("2026-11-27T10:00:00.000Z")).label).toBe("Fechado · abre hoje às 09:00");
    expect(openStatus(shop, new Date("2026-11-27T23:30:00.000Z")).label).toBe("Fechado · abre amanhã às 08:00");
    expect(openStatus(shop, new Date("2026-11-29T15:00:00.000Z")).label).toBe("Fechado · abre terça às 09:00");
  });

  it("fechamento do dia conta como fechado", () => {
    const closed = { ...shop, closures: [{ date: "2026-11-27", reason: "Feriado" }] };
    expect(openStatus(closed, new Date("2026-11-27T15:00:00.000Z")).isOpen).toBe(false);
  });
});

describe("ratingSummary", () => {
  const r = (rating: number, professionalId = "pro-1") => ({ rating, professionalId }) as Review;
  it("média com uma casa e contagem", () => {
    expect(ratingSummary([r(5), r(4), r(4, "pro-2")])).toEqual({ average: 4.3, count: 3 });
    expect(ratingSummary([r(5), r(4), r(4, "pro-2")], "pro-1")).toEqual({ average: 4.5, count: 2 });
    expect(ratingSummary([])).toEqual({ average: null, count: 0 });
  });
});

describe("weeklyHoursProblem", () => {
  it("aceita grade válida e aponta início depois do fim ou sobreposição", () => {
    const ok = [{ weekday: 1, ranges: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "19:00" }] }];
    expect(weeklyHoursProblem(ok)).toBeNull();
    expect(weeklyHoursProblem([{ weekday: 2, ranges: [{ start: "12:00", end: "09:00" }] }])).toMatch(/terça/);
    expect(
      weeklyHoursProblem([{ weekday: 3, ranges: [{ start: "09:00", end: "13:00" }, { start: "12:00", end: "18:00" }] }]),
    ).toMatch(/sobrepõem/);
  });
});

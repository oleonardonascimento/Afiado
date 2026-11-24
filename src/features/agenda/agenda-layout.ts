/** Geometria da agenda (posição dos blocos na grade). Sem regra de negócio. */
import type { Barbershop } from "@/domain/entities";
import { timeOf, toMinutes, weekdayOf } from "@/lib/calendar";

export const PX_PER_MIN = 1.2;
export const SLOT_MINUTES = 15;

/** Primeira e última hora da grade do dia (expediente da casa; padrão 08–20 se fechado). */
export function dayBounds(
  shop: Barbershop,
  date: string,
): { start: number; end: number; closed: boolean } {
  const ranges =
    shop.hours.find((h) => h.weekday === weekdayOf(date))?.ranges ?? [];
  const closed =
    ranges.length === 0 || shop.closures.some((c) => c.date === date);
  if (ranges.length === 0) return { start: 8 * 60, end: 20 * 60, closed };
  const start = Math.min(...ranges.map((r) => toMinutes(r.start)));
  const end = Math.max(...ranges.map((r) => toMinutes(r.end)));
  return {
    start: Math.floor(start / 60) * 60,
    end: Math.ceil(end / 60) * 60,
    closed,
  };
}

/** top/height em px de um intervalo dentro da grade. */
export function blockBox(startIso: string, endIso: string, gridStart: number) {
  const from = toMinutes(timeOf(startIso));
  const minutes = Math.max(
    SLOT_MINUTES,
    (Date.parse(endIso) - Date.parse(startIso)) / 60_000,
  );
  return { top: (from - gridStart) * PX_PER_MIN, height: minutes * PX_PER_MIN };
}

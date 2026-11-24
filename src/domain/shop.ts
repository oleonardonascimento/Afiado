/** Status de funcionamento e notas — usados na página pública. */
import type { Barbershop, Review } from "@/domain/entities";
import { addDays, timeOf, todayIn, weekdayOf } from "@/lib/calendar";

const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function rangesOn(shop: Barbershop, date: string) {
  if (shop.closures.some((c) => c.date === date)) return [];
  return shop.hours.find((h) => h.weekday === weekdayOf(date))?.ranges ?? [];
}

export function openStatus(shop: Barbershop, now: Date): { isOpen: boolean; label: string } {
  const today = todayIn(now);
  const time = timeOf(now);
  const current = rangesOn(shop, today).find((r) => r.start <= time && time < r.end);
  if (current) return { isOpen: true, label: `Aberto agora · fecha às ${current.end}` };

  for (let offset = 0; offset <= 7; offset++) {
    const date = addDays(today, offset);
    const next = rangesOn(shop, date).find((r) => offset > 0 || r.start > time);
    if (!next) continue;
    const when = offset === 0 ? "hoje" : offset === 1 ? "amanhã" : WEEKDAY_NAMES[weekdayOf(date)];
    return { isOpen: false, label: `Fechado · abre ${when} às ${next.start}` };
  }
  return { isOpen: false, label: "Fechado" };
}

export function ratingSummary(
  reviews: Pick<Review, "rating" | "professionalId">[],
  professionalId?: string,
): { average: number | null; count: number } {
  const list = professionalId ? reviews.filter((r) => r.professionalId === professionalId) : reviews;
  if (list.length === 0) return { average: null, count: 0 };
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return { average: Math.round(avg * 10) / 10, count: list.length };
}

export { WEEKDAY_NAMES };

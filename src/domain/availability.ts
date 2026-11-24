/**
 * Horários realmente livres (PRD RF-04): expediente da barbearia e do barbeiro,
 * folgas/bloqueios, duração somada, agendamentos existentes (+ intervalo),
 * antecedência mínima e janela máxima.
 */
import type {
  Appointment,
  Barbershop,
  Professional,
  Service,
  TimeOff,
  TimeRange,
} from "@/domain/entities";
import { addDays, atTime, fromMinutes, toMinutes, todayIn, weekdayOf } from "@/lib/calendar";

export type AvailabilityInput = {
  date: string;
  serviceIds: string[];
  /** null = "qualquer disponível" */
  professionalId: string | null;
  shop: Barbershop;
  professionals: Professional[];
  services: Service[];
  appointments: Appointment[];
  timeOff: TimeOff[];
  now: Date;
  /** Ao remarcar, o próprio agendamento não ocupa a agenda. */
  ignoreAppointmentId?: string;
};

export type Slot = { start: string; end: string; professionalId: string };

const BLOCKING: Appointment["status"][] = ["scheduled", "confirmed", "in_service", "done"];

export function totalDuration(serviceIds: string[], services: Service[]): number {
  return serviceIds.reduce(
    (sum, id) => sum + (services.find((s) => s.id === id)?.durationMinutes ?? 0),
    0,
  );
}

/** Barbeiros ativos que fazem todos os serviços escolhidos. */
export function professionalsFor(serviceIds: string[], professionals: Professional[]): Professional[] {
  return professionals.filter(
    (p) => p.active && serviceIds.length > 0 && serviceIds.every((id) => p.serviceIds.includes(id)),
  );
}

function intersect(a: TimeRange[], b: TimeRange[]): [number, number][] {
  const out: [number, number][] = [];
  for (const x of a) {
    for (const y of b) {
      const start = Math.max(toMinutes(x.start), toMinutes(y.start));
      const end = Math.min(toMinutes(x.end), toMinutes(y.end));
      if (start < end) out.push([start, end]);
    }
  }
  return out;
}

export function availableSlots(input: AvailabilityInput): Slot[] {
  const { date, shop, now } = input;
  const rules = shop.booking;
  const today = todayIn(now);
  if (date < today || date > addDays(today, rules.maxDaysAhead)) return [];
  if (shop.closures.some((c) => c.date === date)) return [];

  const duration = totalDuration(input.serviceIds, input.services);
  if (duration === 0 || input.serviceIds.some((id) => !input.services.find((s) => s.id === id)?.active)) {
    return [];
  }

  const weekday = weekdayOf(date);
  const shopRanges = shop.hours.find((h) => h.weekday === weekday)?.ranges ?? [];
  const earliest = now.getTime() + rules.minAdvanceMinutes * 60_000;
  const buffer = rules.bufferMinutes * 60_000;

  const candidates = professionalsFor(input.serviceIds, input.professionals).filter(
    (p) => input.professionalId === null || p.id === input.professionalId,
  );

  const perPro = candidates.map((pro) => {
    const busy = input.appointments
      .filter(
        (a) =>
          a.professionalId === pro.id &&
          a.id !== input.ignoreAppointmentId &&
          BLOCKING.includes(a.status),
      )
      .map((a) => [Date.parse(a.start) - buffer, Date.parse(a.end) + buffer] as const);
    const off = input.timeOff
      .filter((t) => t.professionalId === pro.id)
      .map((t) => [Date.parse(t.start), Date.parse(t.end)] as const);
    const blocked = [...busy, ...off];
    const bookedCount = busy.length;

    const slots: Slot[] = [];
    const proRanges = pro.hours.find((h) => h.weekday === weekday)?.ranges ?? [];
    for (const [rangeStart, rangeEnd] of intersect(shopRanges, proRanges)) {
      for (let t = rangeStart; t + duration <= rangeEnd; t += rules.slotStepMinutes) {
        const start = atTime(date, fromMinutes(t));
        const end = atTime(date, fromMinutes(t + duration));
        const s = Date.parse(start);
        const e = Date.parse(end);
        if (s < earliest) continue;
        if (blocked.some(([bs, be]) => s < be && e > bs)) continue;
        slots.push({ start, end, professionalId: pro.id });
      }
    }
    return { pro, slots, bookedCount };
  });

  if (input.professionalId !== null) return perPro[0]?.slots ?? [];

  // "Qualquer disponível": um horário por início, com o barbeiro menos ocupado no dia.
  const order = [...perPro].sort((a, b) => a.bookedCount - b.bookedCount);
  const byStart = new Map<string, Slot>();
  for (const { slots } of order) {
    for (const slot of slots) if (!byStart.has(slot.start)) byStart.set(slot.start, slot);
  }
  return [...byStart.values()].sort((a, b) => a.start.localeCompare(b.start));
}

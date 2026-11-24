/**
 * Datas de calendário (YYYY-MM-DD) e horários (HH:mm) no fuso da barbearia,
 * independentes do fuso do navegador.
 */
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TZ } from "@/lib/format";

export function todayIn(now: Date): string {
  return formatInTimeZone(now, TZ, "yyyy-MM-dd");
}

export function dateOf(iso: string | Date): string {
  return formatInTimeZone(iso, TZ, "yyyy-MM-dd");
}

export function timeOf(iso: string | Date): string {
  return formatInTimeZone(iso, TZ, "HH:mm");
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Soma meses mantendo o dia (limitado ao fim do mês). */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1, 12));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86_400_000);
}

/** Meio-dia (SP) da data, para formatar dias sem risco de virar o dia por fuso. */
export function middayIso(date: string): string {
  return `${date}T15:00:00.000Z`;
}

/** Instante (ISO UTC) de uma data + hora no fuso da barbearia. */
export function atTime(date: string, hhmm: string): string {
  return fromZonedTime(`${date}T${hhmm}:00`, TZ).toISOString();
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

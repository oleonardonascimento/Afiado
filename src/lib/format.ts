import { ptBR } from "date-fns/locale";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const TZ = "America/Sao_Paulo";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Valores monetários do domínio são inteiros em centavos. */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/\u00a0/g, " ");
}

export function formatDate(iso: string, pattern = "dd/MM"): string {
  return formatInTimeZone(iso, TZ, pattern, { locale: ptBR });
}

export function formatTime(iso: string): string {
  return formatInTimeZone(iso, TZ, "HH:mm", { locale: ptBR });
}

export function formatWeekday(iso: string): string {
  return formatInTimeZone(iso, TZ, "EEEE", { locale: ptBR });
}

/** Telefone guardado só com dígitos (DDD + número). */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

export function toZoned(iso: string): Date {
  return toZonedTime(iso, TZ);
}

/** Lê um valor digitado em reais ("45", "45,50", "R$ 1.234,56") e devolve centavos; null se inválido. */
export function parseBRL(text: string): number | null {
  const clean = text.replace(/R\$\s?/, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** Centavos no formato de edição ("45,50"), sem o símbolo. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

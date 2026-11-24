/** Rótulos de interface (pt-BR) para valores do domínio. Glossário: docs/glossario.md */
import type {
  AppointmentStatus,
  ClientSource,
  PaymentMethod,
  ServiceCategory,
  StaffRole,
  SubscriptionStatus,
} from "@/domain/entities";

export const CLIENT_SOURCE_LABEL: Record<ClientSource, string> = {
  instagram: "Instagram",
  google: "Google",
  indicacao: "Indicação de amigo",
  passando: "Passei na frente",
  outro: "Outro",
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_service: "Em atendimento",
  done: "Concluído",
  no_show: "Faltou",
  canceled: "Cancelado",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
};

export const SERVICE_CATEGORY_LABEL: Record<ServiceCategory, string> = {
  corte: "Cortes",
  barba: "Barba",
  combo: "Combos",
  tratamento: "Tratamentos",
  outros: "Acabamentos",
};

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: "Dono",
  barber: "Barbeiro",
  reception: "Recepção",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Ativo",
  past_due: "Pagamento pendente",
  canceling: "Cancelado, vale até o fim do período",
  canceled: "Cancelado",
};

export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

/** Primeira letra maiúscula, resto como está ("terça-feira" → "Terça-feira"). */
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Corte à vontade" ou "4× Barba por mês". */
export function benefitLabel(
  serviceName: string,
  monthlyLimit: number | null,
): string {
  return monthlyLimit === null
    ? `${serviceName} à vontade`
    : `${monthlyLimit}× ${serviceName} por mês`;
}

/** Status curto para tabelas e filtros. */
export const SUBSCRIPTION_STATUS_SHORT: Record<SubscriptionStatus, string> = {
  active: "Ativo",
  past_due: "Pagamento pendente",
  canceling: "Cancelando",
  canceled: "Cancelado",
};

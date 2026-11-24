/** Regras de remarcação/cancelamento pelo cliente (RF-07) e modelos de mensagem. */
import type { Appointment } from "@/domain/entities";

export type ChangePolicy = { allowed: true } | { allowed: false; reason: string };

export function changePolicy(
  appointment: Pick<Appointment, "start" | "status">,
  now: Date,
  deadlineHours: number,
): ChangePolicy {
  if (appointment.status !== "scheduled" && appointment.status !== "confirmed") {
    return { allowed: false, reason: "Este agendamento não pode mais ser alterado." };
  }
  const limit = Date.parse(appointment.start) - deadlineHours * 3_600_000;
  if (now.getTime() > limit) {
    return {
      allowed: false,
      reason: `Faltam menos de ${deadlineHours} horas para o horário. Para remarcar ou cancelar, fale com a barbearia pelo WhatsApp.`,
    };
  }
  return { allowed: true };
}

export type TemplateVars = Partial<Record<"nome" | "data" | "hora", string>>;

export function fillTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(nome|data|hora)\}/g, (match, key: keyof TemplateVars) => vars[key] ?? match);
}

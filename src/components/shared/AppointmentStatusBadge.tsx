/**
 * Status do agendamento com cor + ícone + texto (PRD §8.2 — a cor nunca é o único sinal).
 * Usado na agenda, na ficha do cliente e no dashboard.
 */
import { Calendar, Check, CheckCheck, Scissors, UserX, X, type LucideIcon } from "lucide-react";
import type { AppointmentStatus } from "@/domain/entities";
import { cn } from "@/lib/cn";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/labels";

export const STATUS_STYLE: Record<AppointmentStatus, { icon: LucideIcon; block: string; badge: string }> = {
  scheduled: {
    icon: Calendar,
    block: "border border-border-strong bg-surface",
    badge: "border border-border-strong text-text",
  },
  confirmed: {
    icon: Check,
    block: "border-l-4 border-info bg-info/12",
    badge: "bg-info/12 text-text",
  },
  in_service: {
    icon: Scissors,
    block: "bg-primary text-primary-fg",
    badge: "bg-primary text-primary-fg",
  },
  done: {
    icon: CheckCheck,
    block: "border-l-4 border-success bg-success/12",
    badge: "bg-success/12 text-text",
  },
  no_show: {
    icon: UserX,
    block: "bg-danger/10 line-through hatched",
    badge: "bg-danger/10 text-danger",
  },
  canceled: {
    icon: X,
    block: "bg-danger/10 line-through hatched",
    badge: "bg-danger/10 text-danger",
  },
};

export function AppointmentStatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const { icon: Icon, badge } = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-control px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        badge,
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      {APPOINTMENT_STATUS_LABEL[status]}
    </span>
  );
}

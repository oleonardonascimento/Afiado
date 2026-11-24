"use client";

/** Visão Semana: lista compacta por dia (melhor que grade de 7 colunas no celular). */
import { Crown } from "lucide-react";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import type { Appointment, Client, Professional } from "@/domain/entities";
import { addDays, dateOf, middayIso, todayIn } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatDate, formatTime } from "@/lib/format";
import { capitalizeFirst, firstName } from "@/lib/labels";

type WeekListProps = {
  weekStart: string;
  appointments: Appointment[];
  clients: Client[];
  professionals: Professional[];
  clubClients: Set<string>;
  onOpen: (id: string) => void;
  onDay: (date: string) => void;
};

export function WeekList({ weekStart, appointments, clients, professionals, clubClients, onOpen, onDay }: WeekListProps) {
  const today = todayIn(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {days.map((day) => {
        const list = appointments
          .filter((a) => dateOf(a.start) === day && a.status !== "canceled")
          .sort((a, b) => a.start.localeCompare(b.start));
        return (
          <section
            key={day}
            aria-label={formatDate(middayIso(day), "EEEE, dd/MM")}
            className={cn("flex flex-col rounded-card border bg-surface", day === today ? "border-primary" : "border-border")}
          >
            <button
              type="button"
              onClick={() => onDay(day)}
              className="flex items-center justify-between border-b border-border px-3 py-2 text-left hover:bg-surface-2"
            >
              <span className="font-medium">{capitalizeFirst(formatDate(middayIso(day), "EEE dd/MM"))}</span>
              <span className="text-sm text-text-muted">{list.length} atend.</span>
            </button>
            {list.length === 0 ? (
              <p className="px-3 py-3 text-sm text-text-muted">Sem agendamentos.</p>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(a.id)}
                      className="flex w-full flex-col gap-1 px-3 py-2 text-left text-sm hover:bg-surface-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">{formatTime(a.start)}</span>
                        <span className="truncate">{clients.find((c) => c.id === a.clientId)?.name ?? "Cliente"}</span>
                        {clubClients.has(a.clientId) && (
                          <Crown className="size-3.5 shrink-0 text-club-fg" strokeWidth={1.75} aria-label="Assinante do Clube" />
                        )}
                      </span>
                      <span className="flex items-center justify-between gap-2 text-text-muted">
                        {firstName(professionals.find((p) => p.id === a.professionalId)?.name ?? "")}
                        <AppointmentStatusBadge status={a.status} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

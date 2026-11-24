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

export function WeekList({
  weekStart,
  appointments,
  clients,
  professionals,
  clubClients,
  onOpen,
  onDay,
}: WeekListProps) {
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
            className={cn(
              "rounded-card bg-surface flex flex-col border",
              day === today ? "border-primary" : "border-border",
            )}
          >
            <button
              type="button"
              onClick={() => onDay(day)}
              className="border-border hover:bg-surface-2 flex items-center justify-between border-b px-3 py-2 text-left"
            >
              <span className="font-medium">
                {capitalizeFirst(formatDate(middayIso(day), "EEE dd/MM"))}
              </span>
              <span className="text-text-muted text-sm">
                {list.length} atend.
              </span>
            </button>
            {list.length === 0 ? (
              <p className="text-text-muted px-3 py-3 text-sm">
                Sem agendamentos.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {list.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(a.id)}
                      className="hover:bg-surface-2 flex w-full flex-col gap-1 px-3 py-2 text-left text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {formatTime(a.start)}
                        </span>
                        <span className="truncate">
                          {clients.find((c) => c.id === a.clientId)?.name ??
                            "Cliente"}
                        </span>
                        {clubClients.has(a.clientId) && (
                          <Crown
                            className="text-club-fg size-3.5 shrink-0"
                            strokeWidth={1.75}
                            aria-label="Assinante do Clube"
                          />
                        )}
                      </span>
                      <span className="text-text-muted flex items-center justify-between gap-2">
                        {firstName(
                          professionals.find((p) => p.id === a.professionalId)
                            ?.name ?? "",
                        )}
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

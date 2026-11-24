"use client";

/** Visão Dia: uma coluna por barbeiro, grade de 15 min, linha do "agora", bloqueios listrados. */
import { Crown, Lock } from "lucide-react";
import { STATUS_STYLE } from "@/components/shared/AppointmentStatusBadge";
import type {
  Appointment,
  Barbershop,
  Client,
  Professional,
  Service,
  TimeOff,
} from "@/domain/entities";
import {
  blockBox,
  dayBounds,
  PX_PER_MIN,
  SLOT_MINUTES,
} from "@/features/agenda/agenda-layout";
import {
  atTime,
  dateOf,
  fromMinutes,
  timeOf,
  todayIn,
  toMinutes,
} from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";
import { APPOINTMENT_STATUS_LABEL, firstName } from "@/lib/labels";

type DayGridProps = {
  date: string;
  shop: Barbershop;
  columns: Professional[];
  appointments: Appointment[];
  timeOff: TimeOff[];
  clients: Client[];
  services: Service[];
  clubClients: Set<string>;
  onOpen: (appointmentId: string) => void;
  onEmpty: (professionalId: string, time: string) => void;
};

export function DayGrid(props: DayGridProps) {
  const {
    date,
    shop,
    columns,
    appointments,
    timeOff,
    clients,
    services,
    clubClients,
    onOpen,
    onEmpty,
  } = props;
  const { start, end, closed } = dayBounds(shop, date);
  const height = (end - start) * PX_PER_MIN;
  const hours = Array.from(
    { length: (end - start) / 60 },
    (_, i) => start + i * 60,
  );
  const now = new Date();
  const nowMinutes = todayIn(now) === date ? toMinutes(timeOf(now)) : null;
  const dayStartIso = atTime(date, "00:00");

  if (columns.length === 0) {
    return (
      <p className="text-text-muted">Nenhum barbeiro ativo para mostrar.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {closed && (
        <p className="rounded-control bg-surface-2 px-3 py-2 text-sm">
          A barbearia não abre neste dia. Agendamentos criados aqui ficam fora
          do horário de funcionamento.
        </p>
      )}
      <div className="rounded-card border-border bg-surface overflow-x-auto border">
        <div className="flex min-w-fit">
          <div className="border-border bg-surface sticky left-0 z-10 w-14 shrink-0 border-r">
            <div className="border-border h-12 border-b" />
            <div className="relative" style={{ height }}>
              {hours.map((h) => (
                <span
                  key={h}
                  className="text-text-muted absolute right-2 -translate-y-1/2 text-xs tabular-nums first:translate-y-0"
                  style={{ top: (h - start) * PX_PER_MIN }}
                >
                  {fromMinutes(h)}
                </span>
              ))}
            </div>
          </div>

          {columns.map((pro) => {
            const proApts = appointments.filter(
              (a) => a.professionalId === pro.id,
            );
            const proBlocks = timeOff.filter(
              (t) =>
                t.professionalId === pro.id &&
                t.start < atTime(date, "23:59") &&
                t.end > dayStartIso,
            );
            return (
              <div
                key={pro.id}
                className="border-border w-44 shrink-0 border-r last:border-r-0 md:min-w-44 md:flex-1"
              >
                <div className="border-border flex h-12 items-center border-b px-3 font-medium">
                  {firstName(pro.name)}
                </div>
                <div className="relative" style={{ height }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-border absolute inset-x-0 border-t"
                      style={{ top: (h - start) * PX_PER_MIN }}
                      aria-hidden
                    />
                  ))}
                  <button
                    type="button"
                    className="absolute inset-0 cursor-cell focus-visible:outline-2"
                    aria-label={`Novo agendamento com ${pro.name}`}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const minutes =
                        start + (e.clientY - rect.top) / PX_PER_MIN;
                      const rounded =
                        Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES;
                      onEmpty(
                        pro.id,
                        fromMinutes(
                          Math.max(
                            start,
                            Math.min(end - SLOT_MINUTES, rounded),
                          ),
                        ),
                      );
                    }}
                  />
                  {proBlocks.map((t) => {
                    const blockStart =
                      t.start < dayStartIso
                        ? atTime(date, fromMinutes(start))
                        : t.start;
                    const blockEnd =
                      dateOf(t.end) !== date
                        ? atTime(date, fromMinutes(end))
                        : t.end;
                    const box = blockBox(blockStart, blockEnd, start);
                    return (
                      <div
                        key={t.id}
                        className="blocked rounded-control text-text-muted pointer-events-none absolute inset-x-1 flex items-start gap-1 p-1.5 text-xs"
                        style={{
                          top: Math.max(0, box.top),
                          height: box.height,
                        }}
                      >
                        <Lock
                          className="size-3.5 shrink-0"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <span className="truncate">
                          Bloqueio{t.reason ? `: ${t.reason}` : ""}
                        </span>
                      </div>
                    );
                  })}
                  {proApts.map((a) => {
                    const box = blockBox(a.start, a.end, start);
                    const style = STATUS_STYLE[a.status];
                    const Icon = style.icon;
                    const client = clients.find((c) => c.id === a.clientId);
                    const names = a.serviceIds
                      .map(
                        (id) => services.find((s) => s.id === id)?.name ?? "",
                      )
                      .join(", ");
                    const isClub = clubClients.has(a.clientId);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onOpen(a.id)}
                        aria-label={`${formatTime(a.start)}, ${client?.name ?? "Cliente"}, ${APPOINTMENT_STATUS_LABEL[a.status]}${isClub ? ", assinante do Clube" : ""}`}
                        className={cn(
                          "rounded-control absolute inset-x-1 flex flex-col overflow-hidden p-1.5 text-left text-xs",
                          style.block,
                        )}
                        style={{ top: box.top, height: box.height - 2 }}
                      >
                        <span className="flex items-center gap-1 font-medium">
                          <Icon
                            className="size-3.5 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          <span className="tabular-nums">
                            {formatTime(a.start)}
                          </span>
                          <span className="truncate">
                            {client?.name ?? "Cliente"}
                          </span>
                          {isClub && (
                            <Crown
                              className="text-club-fg ml-auto size-3.5 shrink-0 rounded-full"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                          )}
                        </span>
                        <span className="truncate opacity-80">{names}</span>
                      </button>
                    );
                  })}
                  {nowMinutes !== null &&
                    nowMinutes >= start &&
                    nowMinutes <= end && (
                      <div
                        className="border-danger pointer-events-none absolute inset-x-0 z-10 border-t-2"
                        style={{ top: (nowMinutes - start) * PX_PER_MIN }}
                        aria-hidden
                      />
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-text-muted text-sm">
        Toque num espaço vazio para criar um agendamento, encaixe ou bloqueio.
      </p>
    </div>
  );
}

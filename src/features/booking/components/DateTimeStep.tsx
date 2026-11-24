"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Slot } from "@/domain/availability";
import { useBookingStore } from "@/features/booking/booking-store";
import {
  useBookingAvailability,
  type DayAvailability,
} from "@/features/booking/hooks/useBookingAvailability";
import { useJoinWaitlist } from "@/features/booking/hooks/useBookingMutations";
import { useCurrentClient } from "@/features/auth/hooks/useClientAuth";
import { cn } from "@/lib/cn";
import { capitalizeFirst } from "@/lib/labels";
import { formatDate, formatTime, formatWeekday } from "@/lib/format";
import { middayIso, timeOf } from "@/lib/calendar";

type DateTimeStepProps = { onChosen: () => void };

const PERIODS = [
  { id: "manha", label: "Manhã", test: (t: string) => t < "12:00" },
  {
    id: "tarde",
    label: "Tarde",
    test: (t: string) => t >= "12:00" && t < "18:00",
  },
  { id: "noite", label: "Noite", test: (t: string) => t >= "18:00" },
];

/** Passo 3: faixa de 14 dias + horários livres agrupados por período. */
export function DateTimeStep({ onChosen }: DateTimeStepProps) {
  const serviceIds = useBookingStore((s) => s.serviceIds);
  const professionalId = useBookingStore((s) => s.professionalId) ?? null;
  const rescheduleId = useBookingStore((s) => s.rescheduleId);
  const chosenDate = useBookingStore((s) => s.date);
  const chooseDate = useBookingStore((s) => s.chooseDate);
  const chooseSlot = useBookingStore((s) => s.chooseSlot);
  const slot = useBookingStore((s) => s.slot);
  const availability = useBookingAvailability({
    serviceIds,
    professionalId,
    ignoreAppointmentId: rescheduleId ?? undefined,
  });

  if (availability.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="rounded-card h-16" />
        <Skeleton className="rounded-card h-40" />
      </div>
    );
  }
  if (availability.isError)
    return <ErrorState onRetry={availability.refetch} />;

  const firstOpen =
    availability.days.find((d) => d.slots.length > 0)?.date ??
    availability.days[0]?.date;
  const date = chosenDate ?? firstOpen ?? null;
  const day = availability.days.find((d) => d.date === date);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold">Escolha o dia e o horário</h2>
      <DayStrip
        days={availability.days}
        selected={date}
        onSelect={chooseDate}
      />
      {day && day.slots.length > 0 ? (
        <SlotGroups
          slots={day.slots}
          selected={slot?.start ?? null}
          onSelect={(s) => {
            chooseDate(day.date);
            chooseSlot({ start: s.start, professionalId: s.professionalId });
            onChosen();
          }}
        />
      ) : day?.status === "open" ? (
        <FullDay
          date={day.date}
          serviceIds={serviceIds}
          professionalId={professionalId}
        />
      ) : (
        day && (
          <EmptyState
            title={
              day.status === "closed"
                ? "A barbearia não abre neste dia"
                : "O barbeiro está de folga neste dia"
            }
            description="Escolha outro dia acima."
          />
        )
      )}
    </div>
  );
}

function DayStrip({
  days,
  selected,
  onSelect,
}: {
  days: DayAvailability[];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1">
      <ul className="flex gap-2" aria-label="Dias">
        {days.map((d) => {
          const iso = middayIso(d.date);
          const full = d.slots.length === 0;
          const isSelected = d.date === selected;
          return (
            <li key={d.date}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(d.date)}
                className={cn(
                  "rounded-control flex h-18 w-16 flex-col items-center justify-center border text-sm transition-colors duration-150",
                  isSelected
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border-strong bg-surface hover:bg-surface-2",
                  full && !isSelected && "text-text-muted",
                )}
              >
                <span>{capitalizeFirst(formatWeekday(iso).slice(0, 3))}</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatDate(iso, "dd")}
                </span>
                <span className="text-xs">{dayNote(d)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function dayNote(d: DayAvailability): string {
  if (d.status === "closed") return "Fechado";
  if (d.status === "off") return "Folga";
  if (d.slots.length === 0) return "Lotado";
  return d.slots.length === 1 ? "1 horário" : `${d.slots.length} horários`;
}

function SlotGroups({
  slots,
  selected,
  onSelect,
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (slot: Slot) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {PERIODS.map((period) => {
        const list = slots.filter((s) => period.test(timeOf(s.start)));
        if (list.length === 0) return null;
        return (
          <section
            key={period.id}
            aria-labelledby={`period-${period.id}`}
            className="flex flex-col gap-2"
          >
            <h3
              id={`period-${period.id}`}
              className="text-text-muted text-sm font-medium"
            >
              {period.label}
            </h3>
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {list.map((s) => (
                <li key={s.start}>
                  <button
                    type="button"
                    aria-pressed={selected === s.start}
                    onClick={() => onSelect(s)}
                    className={cn(
                      "rounded-control h-11 w-full border font-medium tabular-nums transition-colors duration-150",
                      selected === s.start
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border-strong bg-surface hover:bg-surface-2",
                    )}
                  >
                    {formatTime(s.start)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function FullDay({
  date,
  serviceIds,
  professionalId,
}: {
  date: string;
  serviceIds: string[];
  professionalId: string | null;
}) {
  const router = useRouter();
  const { client } = useCurrentClient();
  const join = useJoinWaitlist();
  const label = formatDate(middayIso(date), "EEEE, dd/MM");

  return (
    <EmptyState
      title={`Sem horários livres em ${label}`}
      description="Entre na lista de espera: se alguém cancelar, você recebe um aviso. Ou escolha outro dia acima."
    >
      {join.isSuccess ? (
        <p className="text-success text-sm font-medium">
          Você está na lista de espera deste dia.
        </p>
      ) : (
        <Button
          variant="secondary"
          loading={join.isPending}
          onClick={() => {
            if (!client) {
              router.push("/entrar?next=/agendar");
              return;
            }
            join.mutate(
              { clientId: client.id, date, serviceIds, professionalId },
              {
                onSuccess: () =>
                  toast.success("Pronto! Avisamos se abrir um horário."),
                onError: () =>
                  toast.error(
                    "Não foi possível entrar na lista. Tente de novo.",
                  ),
              },
            );
          }}
        >
          Entrar na lista de espera
        </Button>
      )}
    </EmptyState>
  );
}

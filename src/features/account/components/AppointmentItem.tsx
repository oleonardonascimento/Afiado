"use client";

/** Um agendamento do cliente, com remarcar/cancelar (respeitando o prazo) e avaliar. */
import { CalendarClock, Star, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { changePolicy } from "@/domain/booking-policy";
import type { Appointment, Professional, Service } from "@/domain/entities";
import { RateDialog } from "@/features/account/components/RateDialog";
import { useCancelAppointment } from "@/features/booking/hooks/useBookingMutations";
import { formatDate, formatTime } from "@/lib/format";
import { APPOINTMENT_STATUS_LABEL, capitalizeFirst } from "@/lib/labels";

type AppointmentItemProps = {
  appointment: Appointment;
  services: Service[];
  professional: Professional | undefined;
  deadlineHours: number;
  reviewed: boolean;
};

export function AppointmentItem({ appointment, services, professional, deadlineHours, reviewed }: AppointmentItemProps) {
  const cancel = useCancelAppointment();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const policy = changePolicy(appointment, new Date(), deadlineHours);
  const names = services.filter((s) => appointment.serviceIds.includes(s.id)).map((s) => s.name);
  const when = capitalizeFirst(formatDate(appointment.start, "EEEE, dd/MM"));
  const upcoming = appointment.status === "scheduled" || appointment.status === "confirmed";

  return (
    <article className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="font-medium">
            {when}, <span className="tabular-nums">{formatTime(appointment.start)}</span>
          </h3>
          <p className="text-sm text-text-muted">
            {names.join(", ")}
            {professional && <> · {professional.name}</>}
          </p>
        </div>
        <span className="shrink-0 text-sm text-text-muted">{APPOINTMENT_STATUS_LABEL[appointment.status]}</span>
      </div>

      {upcoming && (
        <div className="flex flex-col gap-2">
          {policy.allowed ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href={`/agendar?remarcar=${appointment.id}&servicos=${appointment.serviceIds.join(",")}&profissional=${appointment.professionalId}`}>
                  <CalendarClock strokeWidth={1.75} aria-hidden />
                  Remarcar
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
                <X strokeWidth={1.75} aria-hidden />
                Cancelar agendamento
              </Button>
            </div>
          ) : (
            <p className="text-sm text-text-muted">{policy.reason}</p>
          )}
        </div>
      )}

      {appointment.status === "done" &&
        (reviewed ? (
          <p className="inline-flex items-center gap-1 text-sm text-text-muted">
            <Star className="size-4" strokeWidth={1.75} aria-hidden /> Você já avaliou este atendimento.
          </p>
        ) : (
          <RateDialog appointment={appointment} professionalName={professional?.name ?? "a equipe"} />
        ))}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancelar o agendamento de {when.toLowerCase()}, {formatTime(appointment.start)}?
            </AlertDialogTitle>
            <AlertDialogDescription>O horário fica livre para outro cliente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                cancel.mutate(appointment.id, {
                  onSuccess: () => toast.success("Agendamento cancelado"),
                  onError: () => toast.error("Não foi possível cancelar. Tente de novo."),
                })
              }
            >
              Cancelar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

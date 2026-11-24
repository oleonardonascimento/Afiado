"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import type { BookingRequest } from "@/data/repositories";
import type { AppointmentStatus, TimeOff } from "@/domain/entities";
import { OPERATION_KEYS, useRepoMutation } from "@/hooks/useRepoMutation";
import { appointmentKeys, catalogKeys, waitlistKeys } from "@/lib/query-keys";

export function useAppointmentsRange(from: string, to: string) {
  return useQuery({
    queryKey: appointmentKeys.range(from, to),
    queryFn: () => repos.appointments.listByRange(from, to),
  });
}

export function useAllAppointments() {
  return useQuery({ queryKey: appointmentKeys.all, queryFn: () => repos.appointments.list() });
}

export function useWaitlist() {
  return useQuery({ queryKey: waitlistKeys.all, queryFn: () => repos.waitlist.list() });
}

/** Confirmar, iniciar, faltou. Cancelar usa o cancelamento do repositório (avisa a lista de espera). */
export function useSetAppointmentStatus() {
  return useRepoMutation(
    ({ id, status }: { id: string; status: AppointmentStatus }) =>
      status === "canceled" ? repos.appointments.cancel(id) : repos.appointments.update(id, { status }),
    [appointmentKeys.all, waitlistKeys.all],
  );
}

/** Concluir = abre a comanda do atendimento. */
export function useCompleteAppointment() {
  return useRepoMutation((id: string) => repos.orders.openFromAppointment(id), OPERATION_KEYS);
}

export function usePanelBooking() {
  return useRepoMutation(
    (request: Omit<BookingRequest, "origin">) => repos.appointments.book({ ...request, origin: "panel" }),
    [appointmentKeys.all],
  );
}

export function useCreateTimeOff() {
  return useRepoMutation((input: Omit<TimeOff, "id">) => repos.timeOff.create(input), [catalogKeys.timeOff]);
}

export function useRemoveTimeOff() {
  return useRepoMutation((id: string) => repos.timeOff.remove(id), [catalogKeys.timeOff]);
}

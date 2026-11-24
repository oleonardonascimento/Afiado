"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { repos } from "@/data";
import type { BookingRequest } from "@/data/repositories";
import type { WaitlistEntry } from "@/domain/entities";
import { appointmentKeys, waitlistKeys } from "@/lib/query-keys";

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: BookingRequest) => repos.appointments.book(request),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      start,
      professionalId,
    }: {
      id: string;
      start: string;
      professionalId: string | null;
    }) => repos.appointments.reschedule(id, { start, professionalId }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repos.appointments.cancel(id),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      await queryClient.invalidateQueries({ queryKey: waitlistKeys.all });
    },
  });
}

export function useJoinWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      entry: Omit<WaitlistEntry, "id" | "createdAt" | "notifiedAt">,
    ) =>
      repos.waitlist.create({
        ...entry,
        createdAt: new Date().toISOString(),
        notifiedAt: null,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: waitlistKeys.all }),
  });
}

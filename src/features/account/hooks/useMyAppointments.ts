"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repos } from "@/data";
import type { Review } from "@/domain/entities";
import { appointmentKeys, reviewKeys } from "@/lib/query-keys";

export function useAppointment(id: string | null) {
  return useQuery({
    queryKey: appointmentKeys.detail(id ?? "none"),
    queryFn: () => (id ? repos.appointments.get(id) : null),
    enabled: id !== null,
  });
}

export function useClientAppointments(clientId: string | null) {
  return useQuery({
    queryKey: appointmentKeys.client(clientId ?? "none"),
    queryFn: () => (clientId ? repos.appointments.listByClient(clientId) : []),
    enabled: clientId !== null,
  });
}

export function useRateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (review: Omit<Review, "id" | "createdAt" | "reply">) =>
      repos.reviews.create({ ...review, createdAt: new Date().toISOString(), reply: null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repos } from "@/data";
import type { Session, StaffRole } from "@/domain/entities";
import { sessionKeys } from "@/lib/query-keys";

export function useSession() {
  return useQuery({ queryKey: sessionKeys.all, queryFn: () => repos.session.get() });
}

/** Papel atual do painel; sem escolha salva, a demonstração abre como Dono. */
export function useStaffRole(): StaffRole {
  const { data } = useSession();
  return data?.role ?? "owner";
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Session>) => repos.session.set(patch),
    onSuccess: (session) => queryClient.setQueryData(sessionKeys.all, session),
  });
}

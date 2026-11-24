"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repos } from "@/data";
import type { Session, StaffRole } from "@/domain/entities";
import { catalogKeys, sessionKeys } from "@/lib/query-keys";

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

/**
 * Membro da equipe logado no painel (V1: escolhido na entrada ou pelo seletor de papel).
 * Sem escolha salva, usa o primeiro profissional ativo do papel atual.
 */
export function useStaffMember() {
  const session = useSession();
  const role = useStaffRole();
  const professionals = useQuery({ queryKey: catalogKeys.professionals, queryFn: () => repos.professionals.list() });
  const list = professionals.data ?? [];
  const chosen = list.find((p) => p.id === session.data?.staffId && p.role === role);
  const staff = chosen ?? list.find((p) => p.active && p.role === role);
  return { role, staff, isLoading: session.isLoading || professionals.isLoading };
}

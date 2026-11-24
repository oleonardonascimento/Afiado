"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import type { NewMovement } from "@/data/repositories";
import type { PaymentMethod } from "@/domain/entities";
import { useRepoMutation } from "@/hooks/useRepoMutation";
import { cashKeys } from "@/lib/query-keys";

const CASH_KEYS = [cashKeys.sessions, cashKeys.movements];

export function useCashSessions() {
  return useQuery({ queryKey: cashKeys.sessions, queryFn: () => repos.cashSessions.list() });
}

export function useCashMovements() {
  return useQuery({ queryKey: cashKeys.movements, queryFn: () => repos.cashMovements.list() });
}

/** Caixa aberto agora (ou null), derivado da lista de sessões. */
export function useOpenCashSession() {
  const sessions = useCashSessions();
  return { ...sessions, session: sessions.data?.find((s) => s.closedAt === null) ?? null };
}

export function useOpenCash() {
  return useRepoMutation(
    ({ openingCents, staffId }: { openingCents: number; staffId: string }) => repos.cash.open(openingCents, staffId),
    CASH_KEYS,
  );
}

export function useAddMovement() {
  return useRepoMutation((input: NewMovement) => repos.cash.addMovement(input), CASH_KEYS);
}

export function useCloseCash() {
  return useRepoMutation(
    ({ id, counted, note }: { id: string; counted: Record<PaymentMethod, number>; note: string }) =>
      repos.cash.close(id, counted, note),
    CASH_KEYS,
  );
}

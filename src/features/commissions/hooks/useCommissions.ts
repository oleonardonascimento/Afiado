"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import { useRepoMutation } from "@/hooks/useRepoMutation";
import { commissionKeys } from "@/lib/query-keys";

export function useCommissions() {
  return useQuery({
    queryKey: commissionKeys.all,
    queryFn: () => repos.commissions.list(),
  });
}

export function useMarkCommissionsPaid() {
  return useRepoMutation(
    (ids: string[]) => repos.commissions.markPaid(ids),
    [commissionKeys.all],
  );
}

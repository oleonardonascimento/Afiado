"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import type { Plan } from "@/domain/entities";
import { useRepoMutation } from "@/hooks/useRepoMutation";
import { catalogKeys, clubKeys } from "@/lib/query-keys";

export function useSubscriptions() {
  return useQuery({
    queryKey: clubKeys.subscriptions,
    queryFn: () => repos.subscriptions.list(),
  });
}

export function useCharges() {
  return useQuery({
    queryKey: clubKeys.charges,
    queryFn: () => repos.charges.list(),
  });
}

export function useSubscribe() {
  return useRepoMutation(
    (input: {
      clientId: string;
      planId: string;
      paymentMethod: "pix" | "card";
    }) => repos.subscriptions.subscribe(input),
    [clubKeys.subscriptions, clubKeys.charges],
  );
}

export function useCancelSubscription() {
  return useRepoMutation(
    (id: string) => repos.subscriptions.cancel(id),
    [clubKeys.subscriptions],
  );
}

export function useSavePlan() {
  return useRepoMutation(
    ({ id, plan }: { id: string | null; plan: Omit<Plan, "id"> }) =>
      id ? repos.plans.update(id, plan) : repos.plans.create(plan),
    [catalogKeys.plans],
  );
}

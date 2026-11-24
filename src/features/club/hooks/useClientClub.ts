"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import { isSubscriptionActive, planUsage } from "@/domain/subscription";
import { catalogKeys, clubKeys, orderKeys } from "@/lib/query-keys";

/** Assinatura mais recente do cliente, plano e uso no período atual. */
export function useClientClub(clientId: string | null) {
  const subscriptions = useQuery({
    queryKey: clubKeys.subscriptions,
    queryFn: () => repos.subscriptions.list(),
    enabled: clientId !== null,
  });
  const plans = useQuery({
    queryKey: catalogKeys.plans,
    queryFn: () => repos.plans.list(),
  });
  const orders = useQuery({
    queryKey: orderKeys.all,
    queryFn: () => repos.orders.list(),
    enabled: clientId !== null,
  });

  const subscription =
    subscriptions.data
      ?.filter((s) => s.clientId === clientId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
  const plan = plans.data?.find((p) => p.id === subscription?.planId) ?? null;
  const active = subscription
    ? isSubscriptionActive(subscription, new Date())
    : false;
  const usage =
    subscription && orders.data ? planUsage(subscription, orders.data) : null;

  return {
    subscription,
    plan,
    active,
    usage,
    isLoading: subscriptions.isLoading || plans.isLoading || orders.isLoading,
    isError: subscriptions.isError || plans.isError || orders.isError,
  };
}

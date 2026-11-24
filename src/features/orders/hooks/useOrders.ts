"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import type { Order, Payment } from "@/domain/entities";
import { OPERATION_KEYS, useRepoMutation } from "@/hooks/useRepoMutation";
import { orderKeys } from "@/lib/query-keys";

export function useOrders() {
  return useQuery({ queryKey: orderKeys.all, queryFn: () => repos.orders.list() });
}

export function useOpenWalkIn() {
  return useRepoMutation(
    (input: { clientId: string | null; professionalId: string }) => repos.orders.openWalkIn(input),
    [orderKeys.all],
  );
}

/** Itens, desconto e cliente de uma comanda aberta. */
export function useUpdateOrder() {
  return useRepoMutation(
    ({ id, patch }: { id: string; patch: Pick<Partial<Order>, "items" | "discountCents" | "clientId"> }) =>
      repos.orders.update(id, patch),
    [orderKeys.all],
  );
}

export function useCloseOrder() {
  return useRepoMutation(
    ({ id, payments }: { id: string; payments: Payment[] }) => repos.orders.close(id, payments),
    OPERATION_KEYS,
  );
}

export function useCancelOrder() {
  return useRepoMutation((id: string) => repos.orders.cancel(id), [orderKeys.all]);
}

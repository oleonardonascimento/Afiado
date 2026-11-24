"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { appointmentKeys, cashKeys, catalogKeys, clubKeys, commissionKeys, orderKeys } from "@/lib/query-keys";

/** Tudo que uma operação de balcão pode mudar (agenda, comandas, caixa, comissões, estoque, Clube). */
export const OPERATION_KEYS: QueryKey[] = [
  appointmentKeys.all,
  orderKeys.all,
  cashKeys.sessions,
  cashKeys.movements,
  commissionKeys.all,
  catalogKeys.products,
  clubKeys.subscriptions,
  clubKeys.charges,
];

/** Mutation que chama um repositório e invalida as query keys afetadas. */
export function useRepoMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>, keys: QueryKey[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

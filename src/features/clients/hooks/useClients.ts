"use client";

import { useQuery } from "@tanstack/react-query";
import { repos } from "@/data";
import type { Client } from "@/domain/entities";
import { useRepoMutation } from "@/hooks/useRepoMutation";
import { clientKeys, sessionKeys } from "@/lib/query-keys";

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: () => repos.clients.list(),
  });
}

export function useCreateClient() {
  return useRepoMutation(
    (input: Omit<Client, "id">) => repos.clients.create(input),
    [clientKeys.all],
  );
}

export function useUpdateClient() {
  return useRepoMutation(
    ({ id, patch }: { id: string; patch: Partial<Omit<Client, "id">> }) =>
      repos.clients.update(id, patch),
    [clientKeys.all, sessionKeys.all],
  );
}

/** "Excluir meus dados": remove o cadastro e encerra a sessão do cliente. */
export function useDeleteMyData() {
  return useRepoMutation(
    async (id: string) => {
      await repos.clients.remove(id);
      await repos.auth.signOut();
    },
    [clientKeys.all, sessionKeys.all],
  );
}

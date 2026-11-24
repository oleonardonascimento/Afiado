"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repos } from "@/data";
import type { SignInRequest } from "@/data/repositories";
import { useSession } from "@/hooks/useSession";
import { clientKeys, sessionKeys } from "@/lib/query-keys";

/** Cliente logado na página pública (null = visitante). */
export function useCurrentClient() {
  const session = useSession();
  const clientId = session.data?.clientId ?? null;
  const client = useQuery({
    queryKey: clientKeys.detail(clientId ?? "none"),
    queryFn: () => (clientId ? repos.clients.get(clientId) : null),
    enabled: clientId !== null,
  });
  return {
    client: client.data ?? null,
    isLoading: session.isLoading || (clientId !== null && client.isLoading),
    isError: session.isError || client.isError,
  };
}

export function useRequestCode() {
  return useMutation({ mutationFn: (phone: string) => repos.auth.requestCode(phone) });
}

export function useVerifyCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: SignInRequest) => repos.auth.verifyCode(request),
    onSuccess: async (client) => {
      queryClient.setQueryData(clientKeys.detail(client.id), client);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repos.auth.signOut(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}

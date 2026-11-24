"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { repos } from "@/data";

export function useResetDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repos.demo.reset(),
    onSuccess: async () => {
      await queryClient.resetQueries();
      toast.success("Dados de demonstração restaurados");
    },
    onError: () =>
      toast.error("Não foi possível restaurar os dados. Tente de novo."),
  });
}

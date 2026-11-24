"use client";

import { repos } from "@/data";
import type { Barbershop, Product, Professional, Service } from "@/domain/entities";
import { useRepoMutation } from "@/hooks/useRepoMutation";
import { catalogKeys, reviewKeys } from "@/lib/query-keys";

/** Salvar (criar ou editar) itens do catálogo e configurações da barbearia. */
export function useSaveService() {
  return useRepoMutation(
    ({ id, data }: { id: string | null; data: Omit<Service, "id"> }) =>
      id ? repos.services.update(id, data) : repos.services.create(data),
    [catalogKeys.services],
  );
}

export function useSaveProduct() {
  return useRepoMutation(
    ({ id, data }: { id: string | null; data: Omit<Product, "id"> }) =>
      id ? repos.products.update(id, data) : repos.products.create(data),
    [catalogKeys.products],
  );
}

export function useSaveProfessional() {
  return useRepoMutation(
    ({ id, data }: { id: string | null; data: Omit<Professional, "id"> }) =>
      id ? repos.professionals.update(id, data) : repos.professionals.create(data),
    [catalogKeys.professionals],
  );
}

export function useUpdateShop() {
  return useRepoMutation((patch: Partial<Barbershop>) => repos.shop.update(patch), [catalogKeys.shop]);
}

export function useReplyReview() {
  return useRepoMutation(
    ({ id, reply }: { id: string; reply: string | null }) => repos.reviews.update(id, { reply }),
    [reviewKeys.all],
  );
}

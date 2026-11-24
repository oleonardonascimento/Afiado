"use client";

import { repos } from "@/data";
import type {
  Barbershop,
  Product,
  Professional,
  Service,
} from "@/domain/entities";
import { useRepoMutation } from "@/hooks/useRepoMutation";
import { catalogKeys, reviewKeys } from "@/lib/query-keys";

/** Salva o serviço e atualiza quais barbeiros fazem esse serviço. */
export function useSaveServiceWithTeam() {
  return useRepoMutation(
    async ({
      id,
      data,
      professionalIds,
      professionals,
    }: {
      id: string | null;
      data: Omit<Service, "id">;
      professionalIds: string[];
      professionals: Professional[];
    }) => {
      const saved = id
        ? await repos.services.update(id, data)
        : await repos.services.create(data);
      const wanted = new Set(professionalIds);
      await Promise.all(
        professionals
          .filter((p) => wanted.has(p.id) !== p.serviceIds.includes(saved.id))
          .map((p) =>
            repos.professionals.update(p.id, {
              serviceIds: wanted.has(p.id)
                ? [...p.serviceIds, saved.id]
                : p.serviceIds.filter((s) => s !== saved.id),
            }),
          ),
      );
      return saved;
    },
    [catalogKeys.services, catalogKeys.professionals],
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
      id
        ? repos.professionals.update(id, data)
        : repos.professionals.create(data),
    [catalogKeys.professionals],
  );
}

export function useUpdateShop() {
  return useRepoMutation(
    (patch: Partial<Barbershop>) => repos.shop.update(patch),
    [catalogKeys.shop],
  );
}

export function useReplyReview() {
  return useRepoMutation(
    ({ id, reply }: { id: string; reply: string | null }) =>
      repos.reviews.update(id, { reply }),
    [reviewKeys.all],
  );
}

/**
 * Implementação ativa dos repositórios. Na V2, NEXT_PUBLIC_DATA_SOURCE=http troca
 * para data/http/ com a mesma interface — sem tocar em componentes nem hooks.
 */
import { createEmptySnapshot } from "@/data/mock/empty-snapshot";
import { createMockRepositories } from "@/data/mock/repositories";
import { createStore } from "@/data/mock/store";
import type { Repositories } from "@/data/repositories";

const storage = typeof window === "undefined" ? null : window.localStorage;

export const repos: Repositories = createMockRepositories(
  createStore({ storage, seed: createEmptySnapshot }),
);

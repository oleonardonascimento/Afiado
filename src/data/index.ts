/**
 * Implementação ativa dos repositórios. Na V2, NEXT_PUBLIC_DATA_SOURCE=http troca
 * para data/http/ com a mesma interface — sem tocar em componentes nem hooks.
 */
import { browserStorage } from "@/data/mock/browser-storage";
import { generateSeed } from "@/data/mock/seed";
import { createMockRepositories } from "@/data/mock/repositories";
import { createStore } from "@/data/mock/store";
import type { Repositories } from "@/data/repositories";

const storage = browserStorage(
  typeof window === "undefined" ? undefined : window,
);

export const repos: Repositories = createMockRepositories(
  createStore({ storage, seed: () => generateSeed(new Date()) }),
);

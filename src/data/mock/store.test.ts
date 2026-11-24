import { describe, expect, it } from "vitest";
import { MockNetworkError } from "@/data/repositories";
import { createStore, DB_KEY, FAIL_KEY } from "@/data/mock/store";
import { createEmptySnapshot } from "@/data/mock/empty-snapshot";

function memoryStorage(overrides: Partial<Storage> = {}): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
    ...overrides,
  };
}

const seed = () => createEmptySnapshot();

describe("store", () => {
  it("sem nada salvo, devolve o seed e grava", () => {
    const storage = memoryStorage();
    const store = createStore({ storage, seed, latency: [0, 0] });
    expect(store.read().version).toBe(1);
    expect(storage.getItem(DB_KEY)).not.toBeNull();
  });

  it("JSON inválido salvo → volta ao seed", () => {
    const storage = memoryStorage();
    storage.setItem(DB_KEY, "{quebrado");
    const store = createStore({ storage, seed, latency: [0, 0] });
    expect(store.read()).toEqual(seed());
  });

  it("snapshot de versão antiga → volta ao seed", () => {
    const storage = memoryStorage();
    storage.setItem(DB_KEY, JSON.stringify({ ...seed(), version: 0 }));
    const store = createStore({ storage, seed, latency: [0, 0] });
    expect(store.read()).toEqual(seed());
  });

  it("sem storage, funciona em memória", () => {
    const store = createStore({ storage: null, seed, latency: [0, 0] });
    store.write((db) => {
      db.shop.name = "Outro";
    });
    expect(store.read().shop.name).toBe("Outro");
  });

  it("storage cheio não lança e mantém a escrita em memória", () => {
    const storage = memoryStorage({
      setItem: () => {
        throw new DOMException("cheio", "QuotaExceededError");
      },
    });
    const store = createStore({ storage, seed, latency: [0, 0] });
    expect(() =>
      store.write((db) => {
        db.shop.name = "Outro";
      }),
    ).not.toThrow();
    expect(store.read().shop.name).toBe("Outro");
  });

  it("reset volta ao seed", () => {
    const store = createStore({
      storage: memoryStorage(),
      seed,
      latency: [0, 0],
    });
    store.write((db) => {
      db.shop.name = "Outro";
    });
    store.reset();
    expect(store.read().shop.name).toBe(seed().shop.name);
  });

  it("flag de falha faz delay rejeitar", async () => {
    const storage = memoryStorage();
    storage.setItem(FAIL_KEY, "1");
    const store = createStore({ storage, seed, latency: [0, 0] });
    await expect(store.delay()).rejects.toBeInstanceOf(MockNetworkError);
  });
});

/**
 * Store do mock: um snapshot único em memória, persistido em localStorage.
 * Único lugar do app que toca localStorage para dados.
 */
import { MockNetworkError } from "@/data/repositories";
import { DbSnapshotSchema, type DbSnapshot } from "@/domain/entities";

export const DB_KEY = "afiado:db:v1";
export const FAIL_KEY = "afiado:debug:fail";

type StoreOptions = {
  storage: Storage | null;
  seed: () => DbSnapshot;
  latency?: [number, number];
  random?: () => number;
};

export type MockStore = {
  read(): DbSnapshot;
  write(fn: (db: DbSnapshot) => void): void;
  reset(): void;
  delay(): Promise<void>;
};

export function createStore({
  storage,
  seed,
  latency = [200, 600],
  random = Math.random,
}: StoreOptions): MockStore {
  let db: DbSnapshot | null = null;

  function load(): DbSnapshot {
    const raw = safeGet(storage, DB_KEY);
    if (raw) {
      try {
        const parsed = DbSnapshotSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return parsed.data;
      } catch {
        // JSON inválido: cai para o seed abaixo.
      }
    }
    const fresh = seed();
    persist(fresh);
    return fresh;
  }

  function persist(value: DbSnapshot) {
    if (!storage) return;
    try {
      storage.setItem(DB_KEY, JSON.stringify(value));
    } catch {
      // Quota cheia ou storage bloqueado: segue só em memória.
    }
  }

  function current(): DbSnapshot {
    db ??= load();
    return db;
  }

  return {
    read: current,
    write(fn) {
      const value = current();
      fn(value);
      persist(value);
    },
    reset() {
      db = seed();
      persist(db);
    },
    async delay() {
      const [min, max] = latency;
      const ms = min + Math.round(random() * (max - min));
      if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
      if (safeGet(storage, FAIL_KEY) === "1") throw new MockNetworkError();
    },
  };
}

function safeGet(storage: Storage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** PRNG determinístico (mulberry32) — para o seed de demonstração. */
export type Random = {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  weighted<T>(entries: readonly (readonly [T, number])[]): T;
  chance(p: number): boolean;
};

export function createRandom(seed: number): Random {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick<T>(arr: readonly T[]): T {
      const value = arr[Math.floor(next() * arr.length)];
      if (value === undefined) throw new Error("pick em lista vazia");
      return value;
    },
    weighted<T>(entries: readonly (readonly [T, number])[]): T {
      const total = entries.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [value, w] of entries) {
        r -= w;
        if (r < 0) return value;
      }
      const last = entries[entries.length - 1];
      if (!last) throw new Error("weighted em lista vazia");
      return last[0];
    },
    chance: (p) => next() < p,
  };
}

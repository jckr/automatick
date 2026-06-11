/**
 * Seeded randomness for deterministic simulations.
 *
 * The engine creates one `SimRandom` per run from a seed and hands it to
 * `init` and `step` (see `SimToolkit` in sim.ts). Sims that draw all their
 * randomness from it are fully reproducible: same seed, same run.
 */

/**
 * A seeded random generator. Callable like `Math.random` — `random()` returns
 * a uniform number in [0, 1) — with convenience methods for the two most
 * common simulation draws.
 */
export type SimRandom = {
  /** Uniform number in [0, 1). Same contract as `Math.random`. */
  (): number;
  /** Uniform integer in [min, max] — inclusive of BOTH bounds. */
  int(min: number, max: number): number;
  /** Uniformly pick one element of `arr`. */
  pick<T>(arr: readonly T[]): T;
};

/**
 * Hash a string seed to a 32-bit unsigned int. Vendored xmur3-style mixer
 * (public domain) — no dependency, just enough avalanche that nearby strings
 * produce unrelated seeds.
 */
function hashStringSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Create a `SimRandom` from a seed. Number seeds are truncated to 32 bits;
 * string seeds are hashed to one. The callable closes over the mutable PRNG
 * state — every call (direct, `int`, or `pick`) advances the same stream.
 */
export function createSimRandom(seed: number | string): SimRandom {
  // Vendored splitmix32 (public domain): a 32-bit counter-based PRNG.
  // Increment the state by the golden-ratio constant, then mix.
  let state = (typeof seed === 'number' ? seed : hashStringSeed(seed)) >>> 0;
  const next = (): number => {
    state = (state + 0x9e3779b9) | 0;
    let t = state ^ (state >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    return (t >>> 0) / 4294967296;
  };

  return Object.assign(() => next(), {
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max + 1 - min));
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)];
    },
  });
}

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
 * Hash a string seed to a 32-bit unsigned int. This is xmur3 — the string
 * hasher conventionally paired with JS PRNGs (public domain, from bryc's
 * collection: https://github.com/bryc/code/blob/master/jshash/PRNGs.md) —
 * giving enough avalanche that nearby strings produce unrelated seeds.
 *
 * The constants are MurmurHash3's, not arbitrary:
 * - 0x6a09e667 seeds the state — the fractional bits of sqrt(2) (the same
 *   "nothing up my sleeve" number SHA-256 uses for h0).
 * - 0xcc9e2d51 is MurmurHash3's c1 round multiplier.
 * - 0x85ebca6b and 0xc2b2ae35 are MurmurHash3's fmix32 finalizer multipliers.
 */
function hashStringSeed(str: string): number {
  let h = 0x6a09e667 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0xcc9e2d51);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Create a `SimRandom` from a seed. Number seeds are truncated to 32 bits;
 * string seeds are hashed to one. The callable closes over the mutable PRNG
 * state — every call (direct, `int`, or `pick`) advances the same stream.
 */
export function createSimRandom(seed: number | string): SimRandom {
  // splitmix32, vendored rather than imported: these ~10 lines of public-
  // domain arithmetic keep the published package zero-dependency, and the
  // SimRandom facade keeps the generator swappable (e.g. for pure-rand's
  // immutable generators, should replay checkpointing ever need snapshotable
  // RNG state) without touching the public API.
  //
  // The algorithm (https://github.com/bryc/code/blob/master/jshash/PRNGs.md):
  // a Weyl sequence — state += 0x9e3779b9, the golden ratio 2^32/phi, whose
  // irrationality spreads successive states maximally around the 32-bit ring —
  // pushed through a 2-round xorshift-multiply mixer. The multipliers
  // 0x21f0aaad / 0x735a2d97 come from hash-prospector's search for low-bias
  // 32-bit finalizers (https://github.com/skeeto/hash-prospector).
  let state = (typeof seed === 'number' ? seed : hashStringSeed(seed)) >>> 0;
  const next = (): number => {
    state = (state + 0x9e3779b9) | 0;
    let t = state ^ (state >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    // Map the mixed 32-bit uint onto [0, 1) — 2**32 buckets, never 1.
    return (t >>> 0) / 2 ** 32;
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

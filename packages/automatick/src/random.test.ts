import { describe, expect, it } from 'vitest';
import { createSimRandom } from './random';

function draws(seed: number | string, count: number): number[] {
  const random = createSimRandom(seed);
  return Array.from({ length: count }, () => random());
}

describe('createSimRandom — callable', () => {
  it('returns numbers in [0, 1)', () => {
    const random = createSimRandom(42);
    for (let i = 0; i < 1000; i++) {
      const v = random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('same numeric seed produces a bit-identical sequence', () => {
    expect(draws(42, 100)).toEqual(draws(42, 100));
  });

  it('different numeric seeds produce different sequences', () => {
    expect(draws(1, 100)).not.toEqual(draws(2, 100));
  });

  it('same string seed produces a bit-identical sequence', () => {
    expect(draws('hello', 100)).toEqual(draws('hello', 100));
  });

  it('different string seeds produce different sequences', () => {
    expect(draws('hello', 100)).not.toEqual(draws('world', 100));
  });

  it('seed 0 and the empty string are valid seeds', () => {
    expect(draws(0, 10)).toEqual(draws(0, 10));
    expect(draws('', 10)).toEqual(draws('', 10));
  });
});

describe('random.int', () => {
  it('reaches both endpoints and never falls outside the bounds', () => {
    const random = createSimRandom('int-bounds');
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = random.int(3, 5);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(5);
      seen.add(v);
    }
    expect(seen.has(3)).toBe(true);
    expect(seen.has(5)).toBe(true);
  });

  it('min === max always returns that value', () => {
    const random = createSimRandom(7);
    for (let i = 0; i < 20; i++) {
      expect(random.int(4, 4)).toBe(4);
    }
  });

  it('handles negative bounds', () => {
    const random = createSimRandom('negatives');
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = random.int(-2, 1);
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThanOrEqual(1);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([-2, -1, 0, 1]));
  });

  it('draws from the same stream as the callable', () => {
    const a = createSimRandom(123);
    const b = createSimRandom(123);
    // Interleaving int() calls must advance the stream identically to
    // computing the same draw by hand from the callable.
    expect(a.int(0, 9)).toBe(Math.floor(b() * 10));
    expect(a()).toBe(b());
  });
});

describe('random.pick', () => {
  it('returns elements of the array', () => {
    const random = createSimRandom('pick');
    const arr = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 200; i++) {
      expect(arr).toContain(random.pick(arr));
    }
  });

  it('covers every element over many draws', () => {
    const random = createSimRandom('pick-coverage');
    const arr = [10, 20, 30, 40];
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      seen.add(random.pick(arr));
    }
    expect(seen).toEqual(new Set(arr));
  });

  it('single-element array always returns that element', () => {
    const random = createSimRandom(99);
    for (let i = 0; i < 20; i++) {
      expect(random.pick(['only'])).toBe('only');
    }
  });
});

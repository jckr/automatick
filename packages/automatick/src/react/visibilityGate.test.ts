import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVisibilityGate } from './visibilityGate';

// ---------------------------------------------------------------------------
// Test double — vitest runs in a node environment, so IntersectionObserver is
// a hand-rolled mock (mirroring canvas.test.ts's DOM mocks). The mock records
// instances and lets tests drive intersection callbacks explicitly.
// ---------------------------------------------------------------------------

type IOEntry = { target: Element; isIntersecting: boolean };

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  cb: (entries: IOEntry[]) => void;
  observed = new Set<Element>();
  disconnected = false;

  constructor(cb: (entries: IOEntry[]) => void) {
    this.cb = cb;
    MockIntersectionObserver.instances.push(this);
  }

  observe(el: Element): void {
    this.observed.add(el);
  }
  unobserve(el: Element): void {
    this.observed.delete(el);
  }
  disconnect(): void {
    this.disconnected = true;
    this.observed.clear();
  }

  /** Test helper: deliver intersection changes. */
  emit(entries: IOEntry[]): void {
    this.cb(entries);
  }
}

function el(): Element {
  return {} as unknown as Element;
}

function lastObserver(): MockIntersectionObserver {
  const { instances } = MockIntersectionObserver;
  return instances[instances.length - 1];
}

const realIO = globalThis.IntersectionObserver;

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver =
    MockIntersectionObserver;
});

afterEach(() => {
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver =
    realIO;
});

describe('createVisibilityGate', () => {
  it('starts hidden until an observed element reports intersecting', () => {
    const gate = createVisibilityGate();
    const a = el();
    gate.observe(a);

    // No callback yet — a freshly mounted offscreen sim must start frozen.
    expect(gate.isVisible()).toBe(false);

    lastObserver().emit([{ target: a, isIntersecting: true }]);
    expect(gate.isVisible()).toBe(true);
  });

  it('is visible when any observed element intersects', () => {
    const gate = createVisibilityGate();
    const a = el();
    const b = el();
    gate.observe(a);
    gate.observe(b);
    const io = lastObserver();

    io.emit([{ target: a, isIntersecting: true }]);
    expect(gate.isVisible()).toBe(true);

    // a leaves but b is still on screen → still visible.
    io.emit([
      { target: a, isIntersecting: false },
      { target: b, isIntersecting: true },
    ]);
    expect(gate.isVisible()).toBe(true);

    // both gone → hidden.
    io.emit([{ target: b, isIntersecting: false }]);
    expect(gate.isVisible()).toBe(false);
  });

  it('fires whenFirstVisible once, on first visibility', () => {
    const gate = createVisibilityGate();
    const a = el();
    gate.observe(a);
    const io = lastObserver();

    const cb = vi.fn();
    gate.whenFirstVisible(cb);
    expect(cb).not.toHaveBeenCalled();

    io.emit([{ target: a, isIntersecting: true }]);
    expect(cb).toHaveBeenCalledTimes(1);

    // Leaving and re-entering must not fire it again — first-visible is latched.
    io.emit([{ target: a, isIntersecting: false }]);
    io.emit([{ target: a, isIntersecting: true }]);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('fires whenFirstVisible synchronously once already visible', () => {
    const gate = createVisibilityGate();
    const a = el();
    gate.observe(a);
    lastObserver().emit([{ target: a, isIntersecting: true }]);

    const cb = vi.fn();
    gate.whenFirstVisible(cb);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('unobserving a target recomputes visibility', () => {
    const gate = createVisibilityGate();
    const a = el();
    const stop = gate.observe(a);
    const io = lastObserver();

    io.emit([{ target: a, isIntersecting: true }]);
    expect(gate.isVisible()).toBe(true);

    // The only visible element is removed → gate goes hidden.
    stop();
    expect(io.observed.has(a)).toBe(false);
    expect(gate.isVisible()).toBe(false);
  });

  it('ignores intersection entries for untracked targets', () => {
    const gate = createVisibilityGate();
    const a = el();
    const stray = el();
    gate.observe(a);
    const io = lastObserver();

    // A trailing entry for an element we never tracked must not flip visibility.
    io.emit([{ target: stray, isIntersecting: true }]);
    expect(gate.isVisible()).toBe(false);
  });

  it('destroy() disconnects the observer', () => {
    const gate = createVisibilityGate();
    gate.observe(el());
    const io = lastObserver();

    gate.destroy();
    expect(io.disconnected).toBe(true);
  });

  describe('without IntersectionObserver (SSR / old engines)', () => {
    beforeEach(() => {
      (
        globalThis as { IntersectionObserver?: unknown }
      ).IntersectionObserver = undefined;
    });

    it('degrades to always-visible with immediate first-visible', () => {
      const gate = createVisibilityGate();
      expect(gate.isVisible()).toBe(true);

      const cb = vi.fn();
      gate.whenFirstVisible(cb);
      expect(cb).toHaveBeenCalledTimes(1);

      // observe()/destroy() are inert no-ops, and never construct an observer.
      const stop = gate.observe(el());
      stop();
      gate.destroy();
      expect(MockIntersectionObserver.instances).toHaveLength(0);
      expect(gate.isVisible()).toBe(true);
    });
  });
});

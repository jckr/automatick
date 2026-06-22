/**
 * Visibility gate for the `pauseWhenHidden` option.
 *
 * Tracks whether any observed element currently intersects the viewport, so the
 * React adapter can **freeze its rAF clock** while the simulation is scrolled
 * offscreen and **defer the first autoplay** until the content is first seen.
 *
 * This is the "gate the clock, not the state machine" rule made concrete: the
 * engine's status is never touched, so a user-paused sim stays paused and no
 * was-playing intent flag is needed. The gate only answers two questions —
 * "should the clock tick right now?" and "has this ever been visible?" — and
 * the adapter does the rest.
 *
 * Framework-free (DOM only, no React) so the engine stays DOM-free and so the
 * logic can be unit-tested against a mocked `IntersectionObserver`, mirroring
 * `canvas.ts`. Visibility is *element* knowledge, so it lives at the adapter
 * layer where the element lives, never in `engine.ts`.
 *
 * **Multiple targets.** A single `<Simulation>` may host more than one canvas
 * (a main canvas plus a chart, say). All observed elements feed one gate and
 * the gate is visible when *any* of them intersects — for the common case
 * (one card that scrolls as a unit) this is exactly right and needs no
 * "designated element" ceremony.
 *
 * **No-IntersectionObserver fallback.** Where `IntersectionObserver` is absent
 * (SSR, jsdom, very old engines) the gate degrades to "always visible": the
 * clock never freezes and autoplay fires immediately, so `pauseWhenHidden`
 * becomes a no-op rather than silently wedging a sim that can never tick.
 */

export type VisibilityGate = {
  /** Whether the frame clock should advance right now (any target on screen). */
  isVisible(): boolean;
  /**
   * Start observing `el`'s viewport intersection. Returns a cleanup that stops
   * observing it. The gate is visible when *any* observed element intersects.
   */
  observe(el: Element): () => void;
  /**
   * Invoke `cb` the first time the gate becomes visible — or synchronously now
   * if it already is. This is how deferred autoplay holds `play()` until the
   * content first scrolls into view.
   */
  whenFirstVisible(cb: () => void): void;
  /** Disconnect the observer and drop all state. */
  destroy(): void;
};

export function createVisibilityGate(): VisibilityGate {
  // Without IntersectionObserver we can't tell offscreen from onscreen, so the
  // safe degradation is "always visible": never freeze, never defer.
  if (typeof IntersectionObserver !== 'function') {
    return {
      isVisible: () => true,
      observe: () => () => {},
      whenFirstVisible: (cb) => cb(),
      destroy: () => {},
    };
  }

  // Per-element intersection state; the gate is visible when any value is true.
  const intersecting = new Map<Element, boolean>();
  let visible = false;
  let everVisible = false;
  // Callbacks waiting for the first visibility (deferred autoplay).
  let pending: Array<() => void> = [];

  function recompute(): void {
    let next = false;
    for (const isOn of intersecting.values()) {
      if (isOn) {
        next = true;
        break;
      }
    }
    visible = next;
    if (visible && !everVisible) {
      everVisible = true;
      const callbacks = pending;
      pending = [];
      for (const cb of callbacks) cb();
    }
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      // unobserve()d elements may still surface a trailing entry — ignore any
      // we're no longer tracking.
      if (!intersecting.has(entry.target)) continue;
      intersecting.set(entry.target, entry.isIntersecting);
    }
    recompute();
  });

  return {
    isVisible: () => visible,

    observe(el: Element): () => void {
      // Seed as not-intersecting until the first callback reports otherwise, so
      // a freshly mounted offscreen sim starts frozen rather than ticking for
      // the frame or two before the observer fires.
      intersecting.set(el, false);
      observer.observe(el);
      return () => {
        observer.unobserve(el);
        intersecting.delete(el);
        recompute();
      };
    },

    whenFirstVisible(cb: () => void): void {
      if (everVisible) cb();
      else pending.push(cb);
    },

    destroy(): void {
      observer.disconnect();
      intersecting.clear();
      pending = [];
    },
  };
}

/**
 * Framework-free canvas attachment — `automatick/canvas`.
 *
 * Connects a snapshot source (a `SimulationEngine`, a worker runner, or
 * anything matching `CanvasSource`) to a `<canvas>` element and injects a
 * {@link CanvasView} toolkit into the author's draw function. No React, no
 * framework — DOM only.
 *
 * Toolkit convention: view helpers are *injected, never imported*. The draw
 * function receives `(ctx, snapshot, view)` and must depend only on the
 * drawing context and on values — never on direct DOM reads — so draw
 * functions stay location-independent (OffscreenCanvas/worker rendering
 * remains reachable).
 */

import type { State } from '../state';

/**
 * Minimal structural interface for anything that can feed a canvas:
 * satisfied by `SimulationEngine`, the worker runner, and the React
 * `EngineContext` value.
 */
export type CanvasSource<Data, Params> = {
  subscribe: (
    listener: (snapshot: State<Data, Params>) => void
  ) => () => void;
  getSnapshot: () => State<Data, Params>;
  /**
   * Optional hook for performance tracking. When present, every draw is
   * timed with `performance.now()` and reported here (this is what feeds
   * `<PerformanceOverlay>` in the React bindings).
   */
  recordDrawTime?: (tick: number, ms: number) => void;
};

/**
 * The view toolkit injected as the third argument of a draw function.
 *
 * One `CanvasView` object exists per attachment — its `width`/`height`/`dpr`
 * fields are mutated in place on resize or devicePixelRatio change, so it is
 * safe to capture, but not to snapshot fields across frames.
 *
 * All helpers operate in logical (CSS pixel) coordinates and restore any
 * context state they touch — they never leak `fillStyle`, `globalAlpha`, or
 * `imageSmoothingEnabled` changes into the author's subsequent drawing.
 */
export type CanvasView = {
  /** Logical (CSS px) drawing width. */
  width: number;
  /** Logical (CSS px) drawing height. */
  height: number;
  /** Current devicePixelRatio applied to the backing store. */
  dpr: number;
  /**
   * No-arg: `clearRect` over the full logical area. With a color: fills the
   * full logical area with that color instead. For a theme-aware background,
   * compose with {@link CanvasView.theme}: `view.clear(view.theme('--bg2'))`.
   */
  clear(color?: string): void;
  /**
   * Translucent full-area fill — the classic trail effect. Fills the full
   * logical area with `color ?? '#000'` at `globalAlpha = alpha`, then
   * restores both `globalAlpha` and `fillStyle`.
   */
  fade(alpha: number, color?: string): void;
  /**
   * Read a CSS custom property from `document.documentElement`, trimmed.
   * Returns `fallback ?? ''` when the property is empty or unavailable.
   * Reads are cached within a single draw call and invalidated per frame.
   *
   * First use lazily wires theme-change observers (class/data-theme/style
   * mutations on `<html>`, plus `prefers-color-scheme`); on a theme change
   * the cache is invalidated and the last snapshot is redrawn immediately —
   * even while the simulation is paused. Sims that never call `theme()` pay
   * nothing.
   */
  theme(varName: string, fallback?: string): string;
  /**
   * Pixel-grid blit: hands `write` a `cols × rows` RGBA buffer
   * (`Uint8ClampedArray`, 4 bytes per cell, row-major), then draws it scaled
   * to the full logical area with image smoothing disabled (crisp cells).
   * The offscreen canvas and ImageData are cached per attachment and only
   * recreated when `cols`/`rows` change.
   */
  blitGrid(
    cols: number,
    rows: number,
    write: (px: Uint8ClampedArray) => void
  ): void;
};

/**
 * Author-written draw function. Called with the 2D context, the latest
 * simulation snapshot, and the injected {@link CanvasView} toolkit. In
 * ownership mode the context is pre-scaled by `dpr` — draw in CSS pixels.
 */
export type CanvasDrawFn<Data, Params> = (
  ctx: CanvasRenderingContext2D,
  snapshot: State<Data, Params>,
  view: CanvasView
) => void;

export type AttachCanvasOptions = {
  /** Logical (CSS px) drawing width — required in ownership mode. */
  width: number;
  /** Logical (CSS px) drawing height — required in ownership mode. */
  height: number;
};

type BlitCache = {
  cols: number;
  rows: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
};

function currentDpr(): number {
  const dpr = globalThis.devicePixelRatio;
  return typeof dpr === 'number' && dpr > 0 ? dpr : 1;
}

function createBlitCache(cols: number, rows: number): BlitCache | null {
  if (typeof document === 'undefined') return null;
  const offscreen = document.createElement('canvas');
  offscreen.width = cols;
  offscreen.height = rows;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return null;
  return {
    cols,
    rows,
    canvas: offscreen,
    ctx: offCtx,
    imageData: offCtx.createImageData(cols, rows),
  };
}

/**
 * Attach a draw function to a canvas in **ownership mode**.
 *
 * The attachment owns the canvas backing store: it sets the `width`/`height`
 * attributes to `options.width × dpr` / `options.height × dpr` and applies a
 * `setTransform(dpr, 0, 0, dpr, 0, 0)` around every draw, so the author draws
 * in CSS pixels. CSS sizing is deliberately left to the consumer — set
 * `style.width`/`style.height` (or equivalent CSS) to `options.width` ×
 * `options.height` yourself.
 *
 * Behavior:
 * - draws once with `source.getSnapshot()` on attach, then on every emit;
 * - tracks `devicePixelRatio` changes (zoom, monitor moves): resizes the
 *   backing store and redraws the last snapshot immediately;
 * - times each draw and reports it via `source.recordDrawTime` when present.
 *
 * Returns a detach function that unsubscribes and disconnects all observers.
 *
 * If the canvas has no 2D context (e.g. jsdom), the attachment is a silent
 * no-op and the returned detach does nothing.
 *
 * @example
 * ```ts
 * import { createEngine } from 'automatick';
 * import { attachCanvas } from 'automatick/canvas';
 *
 * const engine = createEngine({ init, step });
 * const detach = attachCanvas(engine, canvas, (ctx, { data }, view) => {
 *   view.clear(view.theme('--bg2', '#fff'));
 *   for (const p of data.particles) ctx.fillRect(p.x, p.y, 2, 2);
 * }, { width: 400, height: 400 });
 * ```
 */
export function attachCanvas<Data, Params>(
  source: CanvasSource<Data, Params>,
  canvas: HTMLCanvasElement,
  draw: CanvasDrawFn<Data, Params>,
  options: AttachCanvasOptions
): () => void {
  return attachImpl(source, canvas, draw, options);
}

/**
 * Attach a draw function in **legacy (measure) mode** — no canvas ownership.
 *
 * The consumer sizes the canvas and manages any DPR transform themselves
 * (the pre-toolkit convention: `width={W * dpr}` plus a manual
 * `setTransform` in the draw). The attachment never resizes the canvas and
 * applies no transform; the injected view derives `width`/`height` from the
 * backing store divided by `devicePixelRatio`.
 *
 * This exists to support `useSimulationCanvas`'s backward-compatible mode.
 * New code should use {@link attachCanvas} with explicit `{ width, height }`.
 */
export function attachCanvasLegacy<Data, Params>(
  source: CanvasSource<Data, Params>,
  canvas: HTMLCanvasElement,
  draw: CanvasDrawFn<Data, Params>
): () => void {
  return attachImpl(source, canvas, draw, null);
}

function attachImpl<Data, Params>(
  source: CanvasSource<Data, Params>,
  canvas: HTMLCanvasElement,
  draw: CanvasDrawFn<Data, Params>,
  options: AttachCanvasOptions | null
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let detached = false;
  let lastSnapshot = source.getSnapshot();
  let blitCache: BlitCache | null = null;

  // theme() read cache — invalidated per frame and on theme changes.
  const themeCache = new Map<string, string>();
  let themeWired = false;

  // Observer/listener teardowns, run by detach.
  const cleanups: Array<() => void> = [];

  const view: CanvasView = {
    width: 0,
    height: 0,
    dpr: 1,

    clear(color?: string): void {
      if (color === undefined) {
        ctx.clearRect(0, 0, view.width, view.height);
        return;
      }
      const prevFill = ctx.fillStyle;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, view.width, view.height);
      ctx.fillStyle = prevFill;
    },

    fade(alpha: number, color?: string): void {
      const prevFill = ctx.fillStyle;
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color ?? '#000';
      ctx.fillRect(0, 0, view.width, view.height);
      ctx.globalAlpha = prevAlpha;
      ctx.fillStyle = prevFill;
    },

    theme(varName: string, fallback?: string): string {
      wireThemeObservers();
      const cached = themeCache.get(varName);
      if (cached !== undefined) return cached;
      let value = '';
      if (
        typeof getComputedStyle === 'function' &&
        typeof document !== 'undefined'
      ) {
        value = getComputedStyle(document.documentElement)
          .getPropertyValue(varName)
          .trim();
      }
      if (value === '') value = fallback ?? '';
      themeCache.set(varName, value);
      return value;
    },

    blitGrid(
      cols: number,
      rows: number,
      write: (px: Uint8ClampedArray) => void
    ): void {
      const cache =
        blitCache && blitCache.cols === cols && blitCache.rows === rows
          ? blitCache
          : createBlitCache(cols, rows);
      if (!cache) return;
      blitCache = cache;
      write(cache.imageData.data);
      cache.ctx.putImageData(cache.imageData, 0, 0);
      const prevSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cache.canvas, 0, 0, view.width, view.height);
      ctx.imageSmoothingEnabled = prevSmoothing;
    },
  };

  /**
   * Sync the view's logical dims and dpr. Ownership mode also resizes the
   * canvas backing store (attributes only — CSS sizing is the consumer's).
   * Legacy mode derives logical dims from the consumer-managed backing store.
   */
  function applySize(): void {
    view.dpr = currentDpr();
    if (options) {
      view.width = options.width;
      view.height = options.height;
      canvas.width = Math.round(options.width * view.dpr);
      canvas.height = Math.round(options.height * view.dpr);
    } else {
      view.width = canvas.width / view.dpr;
      view.height = canvas.height / view.dpr;
    }
  }

  function renderFrame(snapshot: State<Data, Params>): void {
    if (detached || !ctx) return;
    lastSnapshot = snapshot;
    // theme() reads are cached per draw call only.
    themeCache.clear();
    // Legacy mode: the consumer may have resized the canvas between frames.
    if (!options) applySize();
    const t0 = performance.now();
    if (options) {
      ctx.save();
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    }
    try {
      draw(ctx, snapshot, view);
    } finally {
      if (options) ctx.restore();
    }
    source.recordDrawTime?.(snapshot.tick, performance.now() - t0);
  }

  /**
   * Lazily wire theme-change observers on first theme() use, so sims that
   * never read theme variables pay nothing.
   */
  function wireThemeObservers(): void {
    if (themeWired) return;
    themeWired = true;
    const onThemeChange = () => {
      if (detached) return;
      themeCache.clear();
      // Redraw with the last snapshot even while paused — fixes the stale
      // canvas after a light/dark switch.
      renderFrame(lastSnapshot);
    };
    if (
      typeof MutationObserver === 'function' &&
      typeof document !== 'undefined'
    ) {
      const observer = new MutationObserver(onThemeChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'style'],
      });
      cleanups.push(() => observer.disconnect());
    }
    if (typeof matchMedia === 'function') {
      const mql = matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', onThemeChange);
      cleanups.push(() => mql.removeEventListener('change', onThemeChange));
    }
  }

  /**
   * Detect devicePixelRatio changes (ownership mode): a `(resolution: …dppx)`
   * media query matches only at the current dpr, so its `change` event fires
   * exactly when dpr changes. The listener is re-armed at each new dpr.
   */
  function armDprListener(): void {
    if (typeof matchMedia !== 'function') return;
    const mql = matchMedia(`(resolution: ${view.dpr}dppx)`);
    const onChange = () => {
      mql.removeEventListener('change', onChange);
      if (detached) return;
      applySize();
      renderFrame(lastSnapshot);
      armDprListener();
    };
    mql.addEventListener('change', onChange);
    cleanups.push(() => mql.removeEventListener('change', onChange));
  }

  applySize();
  if (options) armDprListener();

  // Initial paint, then draw on every emit.
  renderFrame(lastSnapshot);
  const unsubscribe = source.subscribe(renderFrame);

  return () => {
    if (detached) return;
    detached = true;
    unsubscribe();
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
    blitCache = null;
  };
}

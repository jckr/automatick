import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachCanvas, attachCanvasLegacy } from './canvas';
import type { CanvasSource, CanvasView } from './canvas';
import type { State } from './state';

// ---------------------------------------------------------------------------
// Test doubles — vitest runs in a node environment, so every DOM surface the
// attachment touches (canvas 2D context, document, matchMedia, observers) is
// a hand-rolled mock.
// ---------------------------------------------------------------------------

type MockCtx = ReturnType<typeof makeMockCtx>;

function makeMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn((w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    })),
    fillStyle: '#initial' as string | CanvasGradient | CanvasPattern,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
  };
}

function makeMockCanvas(ctx: MockCtx) {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn((kind: string) => (kind === '2d' ? ctx : null)),
  };
}

// Tests pass structural mocks where DOM types are expected; the casts below
// are confined to test code (mirroring engine.test.ts's rAF stubs).
function asCanvas(mock: ReturnType<typeof makeMockCanvas>): HTMLCanvasElement {
  return mock as unknown as HTMLCanvasElement;
}

type Snap = State<{ n: number }, { p: number }>;

function makeSnapshot(tick = 0, status: Snap['status'] = 'paused'): Snap {
  return { data: { n: tick }, params: { p: 1 }, tick, status, stepDurationMs: 0 };
}

function makeMockSource(initial: Snap = makeSnapshot()) {
  let snapshot = initial;
  const listeners = new Set<(s: Snap) => void>();
  const unsubscribed = vi.fn();
  // No type annotation: keeping the inferred shape preserves vi.fn typing on
  // the spies; attachCanvas accepts it structurally as a CanvasSource.
  const source = {
    subscribe: vi.fn((listener: (s: Snap) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        unsubscribed();
      };
    }),
    getSnapshot: () => snapshot,
    recordDrawTime: vi.fn(),
  };
  return {
    source,
    unsubscribed,
    emit(next: Snap) {
      snapshot = next;
      for (const l of listeners) l(next);
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

// --- Global stubs ----------------------------------------------------------

class MockMutationObserver {
  static instances: MockMutationObserver[] = [];
  callback: () => void;
  observedTarget: unknown = null;
  observedOptions: unknown = null;
  disconnected = false;
  constructor(callback: () => void) {
    this.callback = callback;
    MockMutationObserver.instances.push(this);
  }
  observe(target: unknown, options: unknown) {
    this.observedTarget = target;
    this.observedOptions = options;
  }
  disconnect() {
    this.disconnected = true;
  }
}

function makeMql(query: string) {
  const listeners = new Set<() => void>();
  return {
    media: query,
    matches: true,
    addEventListener: vi.fn((_type: string, l: () => void) => {
      listeners.add(l);
    }),
    removeEventListener: vi.fn((_type: string, l: () => void) => {
      listeners.delete(l);
    }),
    fire() {
      for (const l of [...listeners]) l();
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

let mqls: Array<ReturnType<typeof makeMql>>;
let documentElement: { tag: string };
let offscreenCtxs: MockCtx[];
let createElementSpy: ReturnType<typeof vi.fn>;
let getPropertyValueSpy: ReturnType<typeof vi.fn>;
let themeValues: Record<string, string>;

beforeEach(() => {
  mqls = [];
  offscreenCtxs = [];
  themeValues = { '--fg1': ' #abc ' };
  MockMutationObserver.instances = [];
  documentElement = { tag: 'html' };

  createElementSpy = vi.fn(() => {
    const offCtx = makeMockCtx();
    offscreenCtxs.push(offCtx);
    return makeMockCanvas(offCtx);
  });
  getPropertyValueSpy = vi.fn((name: string) => themeValues[name] ?? '');

  vi.stubGlobal('devicePixelRatio', 2);
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const mql = makeMql(query);
      mqls.push(mql);
      return mql;
    })
  );
  vi.stubGlobal('MutationObserver', MockMutationObserver);
  vi.stubGlobal('document', {
    documentElement,
    createElement: createElementSpy,
  });
  vi.stubGlobal(
    'getComputedStyle',
    vi.fn(() => ({ getPropertyValue: getPropertyValueSpy }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function attachOwned(overrides?: { width?: number; height?: number }) {
  const ctx = makeMockCtx();
  const canvasMock = makeMockCanvas(ctx);
  const { source, emit, unsubscribed, ...rest } = makeMockSource();
  const draw = vi.fn();
  const detach = attachCanvas(source, asCanvas(canvasMock), draw, {
    width: overrides?.width ?? 100,
    height: overrides?.height ?? 50,
  });
  return { ctx, canvasMock, source, emit, unsubscribed, draw, detach, ...rest };
}

// ===========================================================================
// Attachment lifecycle
// ===========================================================================

describe('attachCanvas — lifecycle', () => {
  it('draws the initial frame from getSnapshot() on attach', () => {
    const { draw, ctx } = attachOwned();
    expect(draw).toHaveBeenCalledTimes(1);
    const [drawCtx, snapshot, view] = draw.mock.calls[0];
    expect(drawCtx).toBe(ctx);
    expect(snapshot.tick).toBe(0);
    expect(view.width).toBe(100);
    expect(view.height).toBe(50);
    expect(view.dpr).toBe(2);
  });

  it('draws on every subscription emit, passing the same view object', () => {
    const { draw, emit } = attachOwned();
    emit(makeSnapshot(1));
    emit(makeSnapshot(2));
    expect(draw).toHaveBeenCalledTimes(3);
    const firstView = draw.mock.calls[0][2];
    expect(draw.mock.calls[1][2]).toBe(firstView);
    expect(draw.mock.calls[2][2]).toBe(firstView);
    expect(draw.mock.calls[2][1].tick).toBe(2);
  });

  it('records draw timing via recordDrawTime when available', () => {
    const { source, emit } = attachOwned();
    emit(makeSnapshot(7));
    expect(source.recordDrawTime).toHaveBeenCalledTimes(2);
    const [tick, ms] = source.recordDrawTime.mock.calls[1];
    expect(tick).toBe(7);
    expect(typeof ms).toBe('number');
    expect(ms).toBeGreaterThanOrEqual(0);
  });

  it('works without recordDrawTime on the source', () => {
    const ctx = makeMockCtx();
    const canvasMock = makeMockCanvas(ctx);
    const snapshot = makeSnapshot();
    const draw = vi.fn();
    const source: CanvasSource<{ n: number }, { p: number }> = {
      subscribe: () => () => {},
      getSnapshot: () => snapshot,
    };
    expect(() =>
      attachCanvas(source, asCanvas(canvasMock), draw, { width: 10, height: 10 })
    ).not.toThrow();
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it('detach unsubscribes and stops drawing', () => {
    const { draw, emit, detach, unsubscribed } = attachOwned();
    detach();
    expect(unsubscribed).toHaveBeenCalledTimes(1);
    emit(makeSnapshot(1));
    expect(draw).toHaveBeenCalledTimes(1); // initial frame only
  });

  it('detach disconnects theme observers and removes media listeners', () => {
    const { draw, detach } = attachOwned();
    // Wire theme observers by reading a variable inside draw.
    draw.mockImplementation((_ctx, _snap, view: CanvasView) => {
      view.theme('--fg1');
    });
    draw.mock.calls[0][2].theme('--fg1'); // simulate a draw-time theme read
    expect(MockMutationObserver.instances).toHaveLength(1);
    detach();
    expect(MockMutationObserver.instances[0].disconnected).toBe(true);
    // every armed media-query listener is removed
    for (const mql of mqls) {
      expect(mql.listenerCount).toBe(0);
    }
  });

  it('returns a no-op detach when the canvas has no 2d context', () => {
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
    };
    const { source, emit } = makeMockSource();
    const draw = vi.fn();
    const detach = attachCanvas(
      source,
      canvasMock as unknown as HTMLCanvasElement,
      draw,
      { width: 10, height: 10 }
    );
    emit(makeSnapshot(1));
    expect(draw).not.toHaveBeenCalled();
    expect(() => detach()).not.toThrow();
  });
});

// ===========================================================================
// DPR ownership
// ===========================================================================

describe('attachCanvas — DPR ownership', () => {
  it('sizes the backing store to logical size × dpr', () => {
    const { canvasMock } = attachOwned({ width: 100, height: 50 });
    expect(canvasMock.width).toBe(200);
    expect(canvasMock.height).toBe(100);
  });

  it('wraps each draw in save / setTransform(dpr) / restore', () => {
    const { ctx, draw } = attachOwned();
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
    // ordering: save → setTransform → draw → restore
    const saveOrder = ctx.save.mock.invocationCallOrder[0];
    const transformOrder = ctx.setTransform.mock.invocationCallOrder[0];
    const drawOrder = draw.mock.invocationCallOrder[0];
    const restoreOrder = ctx.restore.mock.invocationCallOrder[0];
    expect(saveOrder).toBeLessThan(transformOrder);
    expect(transformOrder).toBeLessThan(drawOrder);
    expect(drawOrder).toBeLessThan(restoreOrder);
  });

  it('restores the context even when draw throws', () => {
    const ctx = makeMockCtx();
    const canvasMock = makeMockCanvas(ctx);
    const { source } = makeMockSource();
    const draw = vi.fn(() => {
      throw new Error('boom');
    });
    expect(() =>
      attachCanvas(source, asCanvas(canvasMock), draw, { width: 10, height: 10 })
    ).toThrow('boom');
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it('arms a resolution media query and resizes + redraws on dpr change', () => {
    const { canvasMock, draw, ctx } = attachOwned({ width: 100, height: 50 });
    const dprMql = mqls.find((m) => m.media.includes('resolution'));
    expect(dprMql).toBeDefined();
    expect(dprMql!.media).toBe('(resolution: 2dppx)');

    vi.stubGlobal('devicePixelRatio', 3);
    dprMql!.fire();

    expect(canvasMock.width).toBe(300);
    expect(canvasMock.height).toBe(150);
    expect(draw).toHaveBeenCalledTimes(2); // initial + dpr-change redraw
    expect(draw.mock.calls[1][2].dpr).toBe(3);
    expect(ctx.setTransform).toHaveBeenLastCalledWith(3, 0, 0, 3, 0, 0);
    // re-armed at the new dpr
    expect(mqls.some((m) => m.media === '(resolution: 3dppx)')).toBe(true);
  });
});

// ===========================================================================
// Legacy mode
// ===========================================================================

describe('attachCanvasLegacy', () => {
  it('never resizes the canvas and applies no transform', () => {
    const ctx = makeMockCtx();
    const canvasMock = makeMockCanvas(ctx);
    canvasMock.width = 800;
    canvasMock.height = 600;
    const { source, emit } = makeMockSource();
    const draw = vi.fn();

    attachCanvasLegacy(source, asCanvas(canvasMock), draw);
    emit(makeSnapshot(1));

    expect(canvasMock.width).toBe(800);
    expect(canvasMock.height).toBe(600);
    expect(ctx.save).not.toHaveBeenCalled();
    expect(ctx.setTransform).not.toHaveBeenCalled();
    expect(ctx.restore).not.toHaveBeenCalled();
    expect(draw).toHaveBeenCalledTimes(2);
  });

  it('derives logical view dims from the backing store and dpr', () => {
    const ctx = makeMockCtx();
    const canvasMock = makeMockCanvas(ctx);
    canvasMock.width = 800; // consumer-managed: 400 logical × dpr 2
    canvasMock.height = 600;
    const { source } = makeMockSource();
    const draw = vi.fn();

    attachCanvasLegacy(source, asCanvas(canvasMock), draw);

    const view: CanvasView = draw.mock.calls[0][2];
    expect(view.width).toBe(400);
    expect(view.height).toBe(300);
    expect(view.dpr).toBe(2);
  });
});

// ===========================================================================
// View helpers
// ===========================================================================

describe('view.clear / view.fade', () => {
  it('clear() with no args clears the logical area', () => {
    const { ctx, draw, emit } = attachOwned({ width: 100, height: 50 });
    draw.mockImplementation((_c, _s, view: CanvasView) => view.clear());
    emit(makeSnapshot(1));
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 50);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('clear(color) fills the logical area and restores fillStyle', () => {
    const { ctx, draw, emit } = attachOwned({ width: 100, height: 50 });
    let fillStyleDuring = '';
    ctx.fillRect.mockImplementation(() => {
      fillStyleDuring = String(ctx.fillStyle);
    });
    draw.mockImplementation((_c, _s, view: CanvasView) => view.clear('#123'));
    emit(makeSnapshot(1));
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 50);
    expect(fillStyleDuring).toBe('#123');
    expect(ctx.fillStyle).toBe('#initial');
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it('fade() fills at the given alpha and restores globalAlpha + fillStyle', () => {
    const { ctx, draw, emit } = attachOwned({ width: 100, height: 50 });
    let alphaDuring = -1;
    let fillStyleDuring = '';
    ctx.fillRect.mockImplementation(() => {
      alphaDuring = ctx.globalAlpha;
      fillStyleDuring = String(ctx.fillStyle);
    });
    draw.mockImplementation((_c, _s, view: CanvasView) => view.fade(0.05));
    emit(makeSnapshot(1));
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 50);
    expect(alphaDuring).toBe(0.05);
    expect(fillStyleDuring).toBe('#000');
    expect(ctx.globalAlpha).toBe(1);
    expect(ctx.fillStyle).toBe('#initial');
  });

  it('fade() accepts a custom color', () => {
    const { ctx, draw, emit } = attachOwned();
    let fillStyleDuring = '';
    ctx.fillRect.mockImplementation(() => {
      fillStyleDuring = String(ctx.fillStyle);
    });
    draw.mockImplementation((_c, _s, view: CanvasView) =>
      view.fade(0.1, '#fff')
    );
    emit(makeSnapshot(1));
    expect(fillStyleDuring).toBe('#fff');
  });
});

describe('view.clear / view.fade — color resolution', () => {
  it("clear('--var') resolves through the theme and wires theme observers", () => {
    const { ctx, draw, emit } = attachOwned();
    let fillStyleDuring = '';
    ctx.fillRect.mockImplementation(() => {
      fillStyleDuring = String(ctx.fillStyle);
    });
    draw.mockImplementation((_c, _s, view: CanvasView) => view.clear('--fg1'));
    emit(makeSnapshot(1));
    expect(fillStyleDuring).toBe('#abc'); // themeValues['--fg1'], trimmed
    // Resolving via the theme wires the observers, so theme switches repaint.
    expect(MockMutationObserver.instances.length).toBeGreaterThan(0);
  });

  it('a non-color string falls back to a --prefixed theme lookup', () => {
    vi.stubGlobal('CSS', { supports: vi.fn(() => false) });
    const { ctx, draw, emit } = attachOwned();
    let fillStyleDuring = '';
    ctx.fillRect.mockImplementation(() => {
      fillStyleDuring = String(ctx.fillStyle);
    });
    draw.mockImplementation((_c, _s, view: CanvasView) => view.clear('fg1'));
    emit(makeSnapshot(1));
    expect(fillStyleDuring).toBe('#abc');
  });

  it('a CSS.supports-validated color is used directly, no theme read', () => {
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
    const { ctx, draw, emit } = attachOwned();
    let fillStyleDuring = '';
    ctx.fillRect.mockImplementation(() => {
      fillStyleDuring = String(ctx.fillStyle);
    });
    draw.mockImplementation((_c, _s, view: CanvasView) => view.clear('red'));
    emit(makeSnapshot(1));
    expect(fillStyleDuring).toBe('red');
    expect(getPropertyValueSpy).not.toHaveBeenCalled();
  });

  it('an unresolvable color paints nothing and logs once, not per frame', () => {
    vi.stubGlobal('CSS', { supports: vi.fn(() => false) });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { ctx, draw, emit } = attachOwned();
      draw.mockImplementation((_c, _s, view: CanvasView) =>
        view.clear('not-a-color')
      );
      emit(makeSnapshot(1));
      emit(makeSnapshot(2));
      expect(ctx.fillRect).not.toHaveBeenCalled();
      expect(ctx.clearRect).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('fade() resolves theme custom properties the same way', () => {
    const { ctx, draw, emit } = attachOwned();
    let fillStyleDuring = '';
    ctx.fillRect.mockImplementation(() => {
      fillStyleDuring = String(ctx.fillStyle);
    });
    draw.mockImplementation((_c, _s, view: CanvasView) =>
      view.fade(0.1, '--fg1')
    );
    emit(makeSnapshot(1));
    expect(fillStyleDuring).toBe('#abc');
  });
});

describe('view.theme', () => {
  it('does not wire observers until first use', () => {
    attachOwned();
    expect(MockMutationObserver.instances).toHaveLength(0);
    expect(
      mqls.some((m) => m.media === '(prefers-color-scheme: dark)')
    ).toBe(false);
  });

  it('reads, trims and caches CSS custom properties within a frame', () => {
    const { draw, emit } = attachOwned();
    let value = '';
    draw.mockImplementation((_c, _s, view: CanvasView) => {
      value = view.theme('--fg1');
      view.theme('--fg1');
      view.theme('--fg1');
    });
    emit(makeSnapshot(1));
    expect(value).toBe('#abc');
    expect(getPropertyValueSpy).toHaveBeenCalledTimes(1);
    // cache is invalidated on the next frame
    emit(makeSnapshot(2));
    expect(getPropertyValueSpy).toHaveBeenCalledTimes(2);
  });

  it('falls back when the property is empty', () => {
    const { draw, emit } = attachOwned();
    let missing = '';
    let defaulted = '';
    draw.mockImplementation((_c, _s, view: CanvasView) => {
      missing = view.theme('--nope');
      defaulted = view.theme('--nope2', '#fallback');
    });
    emit(makeSnapshot(1));
    expect(missing).toBe('');
    expect(defaulted).toBe('#fallback');
  });

  it('wires observers lazily on first use, watching documentElement attributes', () => {
    const { draw, emit } = attachOwned();
    draw.mockImplementation((_c, _s, view: CanvasView) => view.theme('--fg1'));
    emit(makeSnapshot(1));
    expect(MockMutationObserver.instances).toHaveLength(1);
    const observer = MockMutationObserver.instances[0];
    expect(observer.observedTarget).toBe(documentElement);
    expect(observer.observedOptions).toEqual({
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });
    expect(
      mqls.some((m) => m.media === '(prefers-color-scheme: dark)')
    ).toBe(true);
    // second theme() use does not re-wire
    emit(makeSnapshot(2));
    expect(MockMutationObserver.instances).toHaveLength(1);
  });

  it('redraws with the last snapshot on theme mutation, even while paused', () => {
    const { draw, emit } = attachOwned();
    const seen: string[] = [];
    draw.mockImplementation((_c, snap: Snap, view: CanvasView) => {
      seen.push(`${snap.tick}:${view.theme('--fg1')}`);
    });
    emit(makeSnapshot(5, 'paused'));
    expect(seen).toEqual(['5:#abc']);

    // No further emits — sim stays paused. Theme flips.
    themeValues['--fg1'] = '#def';
    MockMutationObserver.instances[0].callback();

    expect(seen).toEqual(['5:#abc', '5:#def']); // same tick, fresh theme read
  });

  it('redraws on prefers-color-scheme change', () => {
    const { draw, emit } = attachOwned();
    draw.mockImplementation((_c, _s, view: CanvasView) => view.theme('--fg1'));
    emit(makeSnapshot(1));
    const schemeMql = mqls.find(
      (m) => m.media === '(prefers-color-scheme: dark)'
    );
    expect(schemeMql).toBeDefined();
    const callsBefore = draw.mock.calls.length;
    schemeMql!.fire();
    expect(draw.mock.calls.length).toBe(callsBefore + 1);
  });
});

describe('view.blitGrid', () => {
  it('creates the offscreen canvas once and reuses it for same dims', () => {
    const { ctx, draw, emit } = attachOwned({ width: 100, height: 50 });
    const buffers: Uint8ClampedArray[] = [];
    draw.mockImplementation((_c, _s, view: CanvasView) => {
      view.blitGrid(10, 5, (px) => buffers.push(px));
    });
    emit(makeSnapshot(1));
    emit(makeSnapshot(2));
    emit(makeSnapshot(3));

    expect(createElementSpy).toHaveBeenCalledTimes(1);
    expect(createElementSpy).toHaveBeenCalledWith('canvas');
    expect(offscreenCtxs[0].createImageData).toHaveBeenCalledTimes(1);
    expect(offscreenCtxs[0].createImageData).toHaveBeenCalledWith(10, 5);
    // same buffer handed to write each frame
    expect(buffers).toHaveLength(3);
    expect(buffers[1]).toBe(buffers[0]);
    expect(buffers[2]).toBe(buffers[0]);
    // blitted to the main ctx, scaled to logical size
    expect(offscreenCtxs[0].putImageData).toHaveBeenCalledTimes(3);
    expect(ctx.drawImage).toHaveBeenCalledTimes(3);
    expect(ctx.drawImage).toHaveBeenLastCalledWith(
      expect.anything(),
      0,
      0,
      100,
      50
    );
  });

  it('recreates the offscreen cache when dimensions change', () => {
    const { draw, emit } = attachOwned();
    let cols = 10;
    draw.mockImplementation((_c, _s, view: CanvasView) => {
      view.blitGrid(cols, 5, () => {});
    });
    emit(makeSnapshot(1));
    expect(createElementSpy).toHaveBeenCalledTimes(1);
    cols = 20;
    emit(makeSnapshot(2));
    expect(createElementSpy).toHaveBeenCalledTimes(2);
    expect(offscreenCtxs[1].createImageData).toHaveBeenCalledWith(20, 5);
    cols = 10; // changing back also recreates (cache holds one entry)
    emit(makeSnapshot(3));
    expect(createElementSpy).toHaveBeenCalledTimes(3);
  });

  it('disables image smoothing during the blit and restores it after', () => {
    const { ctx, draw, emit } = attachOwned();
    let smoothingDuring: boolean | null = null;
    ctx.drawImage.mockImplementation(() => {
      smoothingDuring = ctx.imageSmoothingEnabled;
    });
    draw.mockImplementation((_c, _s, view: CanvasView) => {
      view.blitGrid(4, 4, () => {});
    });
    emit(makeSnapshot(1));
    expect(smoothingDuring).toBe(false);
    expect(ctx.imageSmoothingEnabled).toBe(true);
  });

  it('writes pixels into the ImageData buffer that gets blitted', () => {
    const { draw, emit } = attachOwned();
    draw.mockImplementation((_c, _s, view: CanvasView) => {
      view.blitGrid(2, 2, (px) => {
        px[0] = 255;
        px[3] = 255;
      });
    });
    emit(makeSnapshot(1));
    const offCtx = offscreenCtxs[0];
    const imageData = offCtx.putImageData.mock.calls[0][0];
    expect(imageData.data[0]).toBe(255);
    expect(imageData.data[3]).toBe(255);
    expect(offCtx.putImageData).toHaveBeenCalledWith(imageData, 0, 0);
  });
});

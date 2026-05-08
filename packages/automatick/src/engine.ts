import { isInitFn } from './sim';
import type { SimInit } from './sim';
import type { State, SimulationStatus } from './state';

export type { SimulationStatus, State } from './state';

export type TickPerformance = {
  tick: number;
  stepMs: number;
  drawMs?: number;
};

export type EngineConfig<Data, Params = Record<string, never>> = {
  /**
   * Initial simulation state — value or `(params) => Data`. See `SimInit`.
   * When a value is passed, the engine `structuredClone`s it on each (re)init.
   */
  init: SimInit<Data, Params>;
  step: (state: State<Data, Params>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  /**
   * Initial param values. Optional — when omitted, the engine seeds an empty
   * params object and `Params` defaults to `Record<string, never>`.
   */
  initialParams?: Params;
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  /**
   * Optional render callback — sugar for the vanilla path. When provided, the
   * engine calls it once with the initial state (right after init) and on
   * every state emit thereafter, equivalent to `engine.subscribe(render)`
   * followed by an initial paint. `subscribe` remains the lower-level
   * primitive; React adapter and worker callers wire their own subscribers.
   */
  render?: (snapshot: State<Data, Params>) => void;
  /**
   * Drive `handleAnimationFrame` from an internal `requestAnimationFrame` loop.
   * Defaults to `true` so vanilla callers don't have to write the loop. The
   * React adapter and worker host pass `false` because they either own the
   * frame loop themselves or run in an environment that has none. The loop is
   * created at construction and torn down by `destroy()`. If
   * `globalThis.requestAnimationFrame` is missing (server, worker), the option
   * is silently a no-op.
   *
   * Note: when `true`, the rAF closure pins this engine in memory — vanilla
   * consumers must call `destroy()` to let it be garbage-collected.
   */
  autoFrame?: boolean;
};

const PERF_BUFFER_SIZE = 120;

export class SimulationEngine<Data, Params = Record<string, never>> {
  private data: Data;
  private params: Params;
  private tick: number = 0;
  private status: SimulationStatus = 'idle';
  private lastUpdateMs: number | null = null;
  private lastStepMs: number = 0;

  private readonly initFn: (params: Params) => Data;
  private readonly stepFn: (state: State<Data, Params>) => Data;
  private readonly shouldStopFn?: (data: Data, params: Params) => boolean;
  private readonly maxTime?: number;
  private delayMs: number;
  private ticksPerFrame: number;

  private readonly listeners = new Set<
    (snapshot: State<Data, Params>) => void
  >();
  private readonly historyListeners = new Set<
    (entry: { tick: number; data: Data }) => void
  >();

  private readonly perfBuffer: TickPerformance[] = [];

  private rafId: number | null = null;
  private rafCancel: ((id: number) => void) | null = null;

  constructor(config: EngineConfig<Data, Params>) {
    const init = config.init;
    if (isInitFn(init)) {
      this.initFn = init;
    } else {
      // Two clones, two threats. The first freezes `init` at construction so
      // later mutations to the caller's literal can't leak in. The second
      // hands the engine its own copy each (re)init so when `step` mutates
      // its `data` argument in place, that mutation can't reach back into
      // `seed` and break the next reset.
      const seed = structuredClone(init);
      this.initFn = () => structuredClone(seed);
    }
    this.stepFn = config.step;
    this.shouldStopFn = config.shouldStop;
    this.maxTime = config.maxTime;
    this.delayMs = config.delayMs ?? 0;
    this.ticksPerFrame = config.ticksPerFrame ?? 1;

    // `initialParams` is optional; when absent we seed an empty params object.
    // The `as Params` is the one cast at this boundary: `Params` defaults to
    // `Record<string, never>`, so `{}` is structurally exact for the default
    // case, and explicit-Params callers always pass `initialParams`.
    this.params = config.initialParams
      ? { ...config.initialParams }
      : ({} as Params);
    this.data = this.initFn(this.params);

    if (config.render) {
      this.listeners.add(config.render);
      config.render(this.getSnapshot());
    }

    const autoFrame = config.autoFrame ?? true;
    if (autoFrame) {
      const raf = globalThis.requestAnimationFrame;
      const caf = globalThis.cancelAnimationFrame;
      if (typeof raf === 'function' && typeof caf === 'function') {
        const loop = (now: number) => {
          this.handleAnimationFrame(now);
          this.rafId = raf(loop);
        };
        this.rafCancel = caf;
        this.rafId = raf(loop);
      }
    }
  }

  getSnapshot(): State<Data, Params> {
    return {
      data: this.data,
      params: this.params,
      tick: this.tick,
      status: this.status,
      stepDurationMs: this.lastStepMs,
    };
  }

  getStatus(): SimulationStatus {
    return this.status;
  }

  getPerformance(): readonly TickPerformance[] {
    return this.perfBuffer;
  }

  setDelayMs(ms: number): void {
    this.delayMs = ms;
  }

  setTicksPerFrame(n: number): void {
    this.ticksPerFrame = n;
  }

  recordDrawTime(tick: number, ms: number): void {
    // Find the entry for this tick (search from the end since it's most recent)
    for (let i = this.perfBuffer.length - 1; i >= 0; i--) {
      if (this.perfBuffer[i].tick === tick) {
        this.perfBuffer[i].drawMs = ms;
        return;
      }
    }
  }

  subscribe(
    listener: (snapshot: State<Data, Params>) => void
  ): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeHistory(
    listener: (entry: { tick: number; data: Data }) => void
  ): () => void {
    this.historyListeners.add(listener);
    return () => {
      this.historyListeners.delete(listener);
    };
  }

  play(): void {
    if (this.status === 'stopped') return;
    if (this.status === 'playing') return;
    this.status = 'playing';
    this.lastUpdateMs = null;
    this.emit();
  }

  pause(): void {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.emit();
  }

  stop(): void {
    if (this.status === 'idle' || this.status === 'stopped') return;
    this.status = 'stopped';
    this.emit();
  }

  seek(targetTick: number): void {
    if (this.status === 'stopped') return;
    if (targetTick <= this.tick) {
      if (this.status !== 'paused') {
        this.status = 'paused';
        this.emit();
      }
      return;
    }
    this.status = 'paused';
    this.lastUpdateMs = null;
    this.advanceTicks(targetTick - this.tick);
    if (this.status === 'paused') {
      this.emit();
    }
  }

  advance(count: number = 1): void {
    if (this.status === 'stopped') return;
    if (this.status === 'playing' || this.status === 'idle') {
      this.status = 'paused';
    }
    this.lastUpdateMs = null;
    this.advanceTicks(count);
    if (this.status === 'paused') {
      this.emit();
    }
  }

  setParams(patch: Partial<Params>): void {
    this.params = { ...this.params, ...patch };
    this.emit();
  }

  resetWith(patch?: Partial<Params>): void {
    if (patch) {
      this.params = { ...this.params, ...patch };
    }
    this.data = this.initFn(this.params);
    this.tick = 0;
    this.status = 'idle';
    this.lastUpdateMs = null;
    this.lastStepMs = 0;
    this.perfBuffer.length = 0;
    this.emit();
  }

  handleAnimationFrame(nowMs: number): void {
    if (this.status !== 'playing') return;

    if (this.lastUpdateMs === null) {
      this.lastUpdateMs = nowMs;
      return;
    }

    if (this.delayMs > 0 && nowMs - this.lastUpdateMs < this.delayMs) return;

    this.lastUpdateMs = nowMs;
    this.advanceTicks(this.ticksPerFrame);
    if (this.status === 'playing') {
      this.emit();
    }
  }

  destroy(): void {
    if (this.rafId !== null && this.rafCancel) {
      this.rafCancel(this.rafId);
    }
    this.rafId = null;
    this.rafCancel = null;
    this.listeners.clear();
    this.historyListeners.clear();
  }

  /**
   * Run step up to `count` ticks. Returns true if all ticks completed
   * without termination, false if stopped early.
   */
  private advanceTicks(count: number): boolean {
    for (let i = 0; i < count; i++) {
      if (this.maxTime !== undefined && this.tick >= this.maxTime) {
        this.status = 'stopped';
        this.emit();
        return false;
      }

      this.tick += 1;

      const t0 = performance.now();
      // `stepDurationMs` is the *previous* tick's duration — the current one
      // hasn't been measured yet.
      this.data = this.stepFn({
        data: this.data,
        params: this.params,
        tick: this.tick,
        status: this.status,
        stepDurationMs: this.lastStepMs,
      });
      const t1 = performance.now();
      this.lastStepMs = t1 - t0;

      // Push to ring buffer
      if (this.perfBuffer.length >= PERF_BUFFER_SIZE) {
        this.perfBuffer.shift();
      }
      this.perfBuffer.push({ tick: this.tick, stepMs: this.lastStepMs });

      this.emitHistory();

      if (this.shouldStopFn?.(this.data, this.params)) {
        this.status = 'stopped';
        this.emit();
        return false;
      }

      if (this.maxTime !== undefined && this.tick >= this.maxTime) {
        this.status = 'stopped';
        this.emit();
        return false;
      }
    }
    return true;
  }

  private emit(): void {
    const snap = this.getSnapshot();
    for (const l of this.listeners) {
      l(snap);
    }
  }

  private emitHistory(): void {
    if (this.historyListeners.size === 0) return;
    const entry = { tick: this.tick, data: this.data };
    for (const l of this.historyListeners) {
      l(entry);
    }
  }
}

export function createEngine<Data, Params = Record<string, never>>(
  config: EngineConfig<Data, Params>
): SimulationEngine<Data, Params> {
  return new SimulationEngine(config);
}

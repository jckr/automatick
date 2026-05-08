import { isInitFn } from './sim';
import type { SimInit, StepArgs } from './sim';

export type SimulationStatus = 'idle' | 'playing' | 'paused' | 'stopped';

export type TickPerformance = {
  tick: number;
  stepMs: number;
  drawMs?: number;
};

export type EngineConfig<Data, Params> = {
  /**
   * Initial simulation state — value or `(params) => Data`. See `SimInit`.
   * When a value is passed, the engine `structuredClone`s it on each (re)init.
   */
  init: SimInit<Data, Params>;
  step: (args: StepArgs<Data, Params>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  initialParams: Params;
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  /**
   * Optional render callback — sugar for the vanilla path. When provided, the
   * engine calls it once with the initial snapshot (right after init) and on
   * every snapshot emit thereafter, equivalent to `engine.subscribe(render)`
   * followed by an initial paint. `subscribe` remains the lower-level
   * primitive; React adapter and worker callers wire their own subscribers.
   */
  render?: (snapshot: EngineSnapshot<Data, Params>) => void;
};

export type EngineSnapshot<Data, Params> = {
  data: Data;
  params: Params;
  tick: number;
  status: SimulationStatus;
  stepDurationMs: number;
};

const PERF_BUFFER_SIZE = 120;

export class SimulationEngine<Data, Params> {
  private data: Data;
  private params: Params;
  private tick: number = 0;
  private status: SimulationStatus = 'idle';
  private lastUpdateMs: number | null = null;
  private lastStepMs: number = 0;

  private readonly initFn: (params: Params) => Data;
  private readonly stepFn: (args: StepArgs<Data, Params>) => Data;
  private readonly shouldStopFn?: (data: Data, params: Params) => boolean;
  private readonly maxTime?: number;
  private delayMs: number;
  private ticksPerFrame: number;

  private readonly listeners = new Set<
    (snapshot: EngineSnapshot<Data, Params>) => void
  >();
  private readonly historyListeners = new Set<
    (entry: { tick: number; data: Data }) => void
  >();

  private readonly perfBuffer: TickPerformance[] = [];

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

    this.params = { ...config.initialParams };
    this.data = this.initFn(this.params);

    if (config.render) {
      this.listeners.add(config.render);
      config.render(this.getSnapshot());
    }
  }

  getSnapshot(): EngineSnapshot<Data, Params> {
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
    listener: (snapshot: EngineSnapshot<Data, Params>) => void
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
      this.data = this.stepFn({
        data: this.data,
        params: this.params,
        tick: this.tick,
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

export function createEngine<Data, Params>(
  config: EngineConfig<Data, Params>
): SimulationEngine<Data, Params> {
  return new SimulationEngine(config);
}

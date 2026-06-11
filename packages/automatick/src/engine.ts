import { isInitFn } from './sim';
import type { SimInit, SimToolkit, StepContext } from './sim';
import { createSimRandom } from './random';
import type { State, SimulationStatus } from './state';

export type { SimulationStatus, State } from './state';

export type TickPerformance = {
  tick: number;
  stepMs: number;
  drawMs?: number;
};

export type EngineConfig<Data, Params = Record<string, never>, Input = never> = {
  /**
   * Initial simulation state — value or `(params) => Data`. See `SimInit`.
   * When a value is passed, the engine `structuredClone`s it on each (re)init.
   */
  init: SimInit<Data, Params, Input>;
  step: (ctx: StepContext<Data, Params, Input>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  /**
   * Initial param values. Optional — when omitted, the engine seeds an empty
   * params object and `Params` defaults to `Record<string, never>`.
   */
  initialParams?: Params;
  /**
   * Seed for the engine's `SimRandom` (see `random.ts`). Number or string.
   * When omitted, the engine picks a random numeric seed at construction and
   * records it — `getSeed()` always returns the seed that reproduces the run.
   * `resetWith()` re-derives the generator from this same seed, so a reset
   * replays the run exactly.
   */
  seed?: number | string;
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  /**
   * Upper bound on the number of inputs queued by `send()` between tick
   * advances (default 1024). Beyond the bound the queue drops its *oldest*
   * entry — the most recent perturbations win.
   */
  maxQueuedInputs?: number;
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

const DEFAULT_MAX_QUEUED_INPUTS = 1024;

/**
 * The one shared "no inputs this tick" array — frozen so a sim can't mutate
 * it, and a single module-level instance so the hot path (the overwhelmingly
 * common no-inputs tick) allocates nothing. `readonly never[]` is assignable
 * to `readonly Input[]` for every `Input`.
 */
const NO_INPUTS: readonly never[] = Object.freeze([]);

export class SimulationEngine<
  Data,
  Params = Record<string, never>,
  Input = never,
> {
  private data: Data;
  private params: Params;
  private tick: number = 0;
  private status: SimulationStatus = 'idle';
  private lastUpdateMs: number | null = null;
  private lastStepMs: number = 0;

  private readonly initFn: (
    params: Params,
    toolkit: SimToolkit<Input>
  ) => Data;
  private readonly stepFn: (ctx: StepContext<Data, Params, Input>) => Data;
  private readonly shouldStopFn?: (data: Data, params: Params) => boolean;
  private readonly maxTime?: number;
  private delayMs: number;
  private ticksPerFrame: number;
  private readonly seed: number | string;
  private readonly maxQueuedInputs: number;
  /**
   * Inputs sent via `send()` and not yet delivered to a tick. Drained whole
   * into the first tick of the next batch (see `drainInputs`).
   */
  private inputQueue: Input[] = [];
  /**
   * One toolkit per run — stable identity between resets (no per-tick
   * allocation), recreated by `resetWith()` so the generator restarts from
   * the same seed and the reset run replays the original exactly. Its
   * `inputs` field is the init-time view: always the empty array — per-tick
   * inputs are composed into the step context at the `step` call site.
   */
  private toolkit: SimToolkit<Input>;

  private readonly listeners = new Set<
    (snapshot: State<Data, Params>) => void
  >();
  private readonly historyListeners = new Set<
    (entry: { tick: number; data: Data }) => void
  >();

  private readonly perfBuffer: TickPerformance[] = [];

  private rafId: number | null = null;
  private rafCancel: ((id: number) => void) | null = null;

  constructor(config: EngineConfig<Data, Params, Input>) {
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
    this.maxQueuedInputs = config.maxQueuedInputs ?? DEFAULT_MAX_QUEUED_INPUTS;

    // When no seed is given, pick a random one and record it so the run is
    // still reproducible: read it back via getSeed().
    this.seed = config.seed ?? Math.floor(Math.random() * 0x100000000);
    this.toolkit = { random: createSimRandom(this.seed), inputs: NO_INPUTS };

    // `initialParams` is optional; when absent we seed an empty params object.
    // The `as Params` is the one cast at this boundary: `Params` defaults to
    // `Record<string, never>`, so `{}` is structurally exact for the default
    // case, and explicit-Params callers always pass `initialParams`.
    this.params = config.initialParams
      ? { ...config.initialParams }
      : ({} as Params);
    this.data = this.initFn(this.params, this.toolkit);

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

  /**
   * The seed this engine's `SimRandom` was derived from — the one passed in
   * `config.seed`, or the recorded random default when none was given.
   * Constructing another engine with this seed reproduces the run.
   */
  getSeed(): number | string {
    return this.seed;
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

  /**
   * Queue a transient perturbation event for delivery to the simulation.
   *
   * Delivery semantics:
   * - The whole queue is delivered, in send order, as `inputs` to the *first*
   *   tick of the next batch; remaining ticks in a `ticksPerFrame` batch see
   *   an empty array.
   * - While `paused`/`idle`, inputs accumulate and deliver on the next
   *   `advance()`/`play()` tick.
   * - While `stopped`, inputs are dropped silently.
   * - The queue is bounded by `maxQueuedInputs` (drop-oldest) and cleared by
   *   `resetWith()`.
   */
  send(input: Input): void {
    if (this.status === 'stopped') return;
    if (this.inputQueue.length >= this.maxQueuedInputs) {
      // Drop-oldest: the most recent perturbations win.
      this.inputQueue.shift();
    }
    this.inputQueue.push(input);
  }

  resetWith(patch?: Partial<Params>): void {
    if (patch) {
      this.params = { ...this.params, ...patch };
    }
    // Re-derive the generator from the same seed so the reset run replays
    // the original exactly. (A fresh toolkit object, same seed.)
    this.toolkit = { random: createSimRandom(this.seed), inputs: NO_INPUTS };
    // A reset run starts clean: pending perturbations belong to the old run.
    this.inputQueue = [];
    this.data = this.initFn(this.params, this.toolkit);
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
   * Hand the queued inputs over for delivery to the tick about to run, and
   * clear the queue. This is the single drain point — when input recording
   * lands (future work), entries are tagged `{ tick, input }` here.
   *
   * Returns the shared frozen `NO_INPUTS` array when nothing is queued, so
   * the common case allocates nothing and keeps a stable identity.
   */
  private drainInputs(): readonly Input[] {
    if (this.inputQueue.length === 0) return NO_INPUTS;
    const drained = this.inputQueue;
    this.inputQueue = [];
    return drained;
  }

  /**
   * Run step up to `count` ticks. Returns true if all ticks completed
   * without termination, false if stopped early.
   *
   * The whole input queue is delivered to the first tick of the batch;
   * subsequent ticks in the batch see the empty array.
   */
  private advanceTicks(count: number): boolean {
    for (let i = 0; i < count; i++) {
      if (this.maxTime !== undefined && this.tick >= this.maxTime) {
        this.status = 'stopped';
        this.emit();
        return false;
      }

      this.tick += 1;

      const inputs = i === 0 ? this.drainInputs() : NO_INPUTS;

      const t0 = performance.now();
      // `stepDurationMs` is the *previous* tick's duration — the current one
      // hasn't been measured yet.
      this.data = this.stepFn({
        data: this.data,
        params: this.params,
        tick: this.tick,
        status: this.status,
        stepDurationMs: this.lastStepMs,
        random: this.toolkit.random,
        inputs,
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

export function createEngine<
  Data,
  Params = Record<string, never>,
  Input = never,
>(
  config: EngineConfig<Data, Params, Input>
): SimulationEngine<Data, Params, Input> {
  return new SimulationEngine(config);
}

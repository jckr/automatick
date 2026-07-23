// src/sim.ts
function isInitFn(init) {
  return typeof init === "function";
}

// src/random.ts
function hashStringSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  h = Math.imul(h ^ h >>> 16, 2246822507);
  h = Math.imul(h ^ h >>> 13, 3266489909);
  return (h ^ h >>> 16) >>> 0;
}
function createSimRandom(seed) {
  let state = (typeof seed === "number" ? seed : hashStringSeed(seed)) >>> 0;
  const next = () => {
    state = state + 2654435769 | 0;
    let t = state ^ state >>> 16;
    t = Math.imul(t, 569420461);
    t = t ^ t >>> 15;
    t = Math.imul(t, 1935289751);
    t = t ^ t >>> 15;
    return (t >>> 0) / 2 ** 32;
  };
  return Object.assign(() => next(), {
    int(min, max) {
      return min + Math.floor(next() * (max + 1 - min));
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    }
  });
}

// src/engine.ts
var PERF_BUFFER_SIZE = 120;
var DEFAULT_MAX_QUEUED_INPUTS = 1024;
var NO_INPUTS = Object.freeze([]);
var SimulationEngine = class {
  data;
  params;
  tick = 0;
  status = "idle";
  lastUpdateMs = null;
  lastStepMs = 0;
  initFn;
  stepFn;
  shouldStopFn;
  maxTime;
  delayMs;
  ticksPerFrame;
  seed;
  maxQueuedInputs;
  /**
   * Inputs sent via `send()` and not yet delivered to a tick. Drained whole
   * into the first tick of the next batch (see `drainInputs`).
   */
  inputQueue = [];
  /**
   * One toolkit per run — stable identity between resets (no per-tick
   * allocation), recreated by `resetWith()` so the generator restarts from
   * the same seed and the reset run replays the original exactly. Its
   * `inputs` field is the init-time view: always the empty array — per-tick
   * inputs are composed into the step context at the `step` call site.
   */
  toolkit;
  listeners = /* @__PURE__ */ new Set();
  historyListeners = /* @__PURE__ */ new Set();
  perfBuffer = [];
  rafId = null;
  rafCancel = null;
  constructor(config) {
    const init = config.init;
    if (isInitFn(init)) {
      this.initFn = init;
    } else {
      const seed = structuredClone(init);
      this.initFn = () => structuredClone(seed);
    }
    this.stepFn = config.step;
    this.shouldStopFn = config.shouldStop;
    this.maxTime = config.maxTime;
    this.delayMs = config.delayMs ?? 0;
    this.ticksPerFrame = config.ticksPerFrame ?? 1;
    this.maxQueuedInputs = config.maxQueuedInputs ?? DEFAULT_MAX_QUEUED_INPUTS;
    this.seed = config.seed ?? Math.floor(Math.random() * 4294967296);
    this.toolkit = { random: createSimRandom(this.seed), inputs: NO_INPUTS };
    this.params = config.initialParams ? { ...config.initialParams } : {};
    this.data = this.initFn(this.params, this.toolkit);
    if (config.render) {
      this.listeners.add(config.render);
      config.render(this.getSnapshot());
    }
    const autoFrame = config.autoFrame ?? true;
    if (autoFrame) {
      const raf = globalThis.requestAnimationFrame;
      const caf = globalThis.cancelAnimationFrame;
      if (typeof raf === "function" && typeof caf === "function") {
        const loop = (now) => {
          this.handleAnimationFrame(now);
          this.rafId = raf(loop);
        };
        this.rafCancel = caf;
        this.rafId = raf(loop);
      }
    }
  }
  getSnapshot() {
    return {
      data: this.data,
      params: this.params,
      tick: this.tick,
      status: this.status,
      stepDurationMs: this.lastStepMs
    };
  }
  getStatus() {
    return this.status;
  }
  /**
   * The seed this engine's `SimRandom` was derived from — the one passed in
   * `config.seed`, or the recorded random default when none was given.
   * Constructing another engine with this seed reproduces the run.
   */
  getSeed() {
    return this.seed;
  }
  getPerformance() {
    return this.perfBuffer;
  }
  setDelayMs(ms) {
    this.delayMs = ms;
  }
  setTicksPerFrame(n) {
    this.ticksPerFrame = n;
  }
  recordDrawTime(tick, ms) {
    for (let i = this.perfBuffer.length - 1; i >= 0; i--) {
      if (this.perfBuffer[i].tick === tick) {
        this.perfBuffer[i].drawMs = ms;
        return;
      }
    }
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  subscribeHistory(listener) {
    this.historyListeners.add(listener);
    return () => {
      this.historyListeners.delete(listener);
    };
  }
  play() {
    if (this.status === "stopped") return;
    if (this.status === "playing") return;
    this.status = "playing";
    this.lastUpdateMs = null;
    this.emit();
  }
  pause() {
    if (this.status !== "playing") return;
    this.status = "paused";
    this.emit();
  }
  stop() {
    if (this.status === "idle" || this.status === "stopped") return;
    this.status = "stopped";
    this.emit();
  }
  seek(targetTick) {
    if (this.status === "stopped") return;
    if (targetTick <= this.tick) {
      if (this.status !== "paused") {
        this.status = "paused";
        this.emit();
      }
      return;
    }
    this.status = "paused";
    this.lastUpdateMs = null;
    this.advanceTicks(targetTick - this.tick);
    if (this.status === "paused") {
      this.emit();
    }
  }
  advance(count = 1) {
    if (this.status === "stopped") return;
    if (this.status === "playing" || this.status === "idle") {
      this.status = "paused";
    }
    this.lastUpdateMs = null;
    this.advanceTicks(count);
    if (this.status === "paused") {
      this.emit();
    }
  }
  setParams(patch) {
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
  send(input) {
    if (this.status === "stopped") return;
    if (this.inputQueue.length >= this.maxQueuedInputs) {
      this.inputQueue.shift();
    }
    this.inputQueue.push(input);
  }
  resetWith(patch) {
    if (patch) {
      this.params = { ...this.params, ...patch };
    }
    this.toolkit = { random: createSimRandom(this.seed), inputs: NO_INPUTS };
    this.inputQueue = [];
    this.data = this.initFn(this.params, this.toolkit);
    this.tick = 0;
    this.status = "idle";
    this.lastUpdateMs = null;
    this.lastStepMs = 0;
    this.perfBuffer.length = 0;
    this.emit();
  }
  handleAnimationFrame(nowMs) {
    if (this.status !== "playing") return;
    if (this.lastUpdateMs === null) {
      this.lastUpdateMs = nowMs;
      return;
    }
    if (this.delayMs > 0 && nowMs - this.lastUpdateMs < this.delayMs) return;
    this.lastUpdateMs = nowMs;
    this.advanceTicks(this.ticksPerFrame);
    if (this.status === "playing") {
      this.emit();
    }
  }
  destroy() {
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
  drainInputs() {
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
  advanceTicks(count) {
    for (let i = 0; i < count; i++) {
      if (this.maxTime !== void 0 && this.tick >= this.maxTime) {
        this.status = "stopped";
        this.emit();
        return false;
      }
      this.tick += 1;
      const inputs = i === 0 ? this.drainInputs() : NO_INPUTS;
      const t0 = performance.now();
      this.data = this.stepFn({
        data: this.data,
        params: this.params,
        tick: this.tick,
        status: this.status,
        stepDurationMs: this.lastStepMs,
        random: this.toolkit.random,
        inputs
      });
      const t1 = performance.now();
      this.lastStepMs = t1 - t0;
      if (this.perfBuffer.length >= PERF_BUFFER_SIZE) {
        this.perfBuffer.shift();
      }
      this.perfBuffer.push({ tick: this.tick, stepMs: this.lastStepMs });
      this.emitHistory();
      if (this.shouldStopFn?.(this.data, this.params)) {
        this.status = "stopped";
        this.emit();
        return false;
      }
      if (this.maxTime !== void 0 && this.tick >= this.maxTime) {
        this.status = "stopped";
        this.emit();
        return false;
      }
    }
    return true;
  }
  emit() {
    const snap = this.getSnapshot();
    for (const l of this.listeners) {
      l(snap);
    }
  }
  emitHistory() {
    if (this.historyListeners.size === 0) return;
    const entry = { tick: this.tick, data: this.data };
    for (const l of this.historyListeners) {
      l(entry);
    }
  }
};
function createEngine(config) {
  return new SimulationEngine(config);
}
export {
  SimulationEngine,
  createEngine
};

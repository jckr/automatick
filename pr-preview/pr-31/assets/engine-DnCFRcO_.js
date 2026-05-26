// src/sim.ts
function isInitFn(init) {
  return typeof init === "function";
}

// src/engine.ts
var PERF_BUFFER_SIZE = 120;
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
    this.params = config.initialParams ? { ...config.initialParams } : {};
    this.data = this.initFn(this.params);
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
  resetWith(patch) {
    if (patch) {
      this.params = { ...this.params, ...patch };
    }
    this.data = this.initFn(this.params);
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
   * Run step up to `count` ticks. Returns true if all ticks completed
   * without termination, false if stopped early.
   */
  advanceTicks(count) {
    for (let i = 0; i < count; i++) {
      if (this.maxTime !== void 0 && this.tick >= this.maxTime) {
        this.status = "stopped";
        this.emit();
        return false;
      }
      this.tick += 1;
      const t0 = performance.now();
      this.data = this.stepFn({
        data: this.data,
        params: this.params,
        tick: this.tick,
        status: this.status,
        stepDurationMs: this.lastStepMs
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

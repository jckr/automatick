/**
 * Main-thread side of the worker runner.
 *
 * Creates a Web Worker, sends commands, and subscribes to snapshot updates.
 * The worker owns the tick loop; this side is a passive subscriber.
 */

import type { TickPerformance } from '../engine';
import type { State } from '../state';
import type { MainToWorkerMessage, WorkerConfig } from './protocol';
import { deserializeWorkerMessage, serializeMainMessage } from './serialize';

export type WorkerRunnerConfig<Params> = {
  initialParams: Params;
  config: WorkerConfig;
};

export type WorkerRunner<Data, Params> = {
  getSnapshot: () => State<Data, Params>;
  subscribe: (
    listener: (snapshot: State<Data, Params>) => void
  ) => () => void;

  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (tick: number) => void;
  advance: (count?: number) => void;
  setParams: (patch: Partial<Params>) => void;
  resetWith: (patch?: Partial<Params>) => void;
  setConfig: (patch: Partial<WorkerConfig>) => void;

  /**
   * Record a draw time for a tick. Draws happen on the main thread, so
   * timings are tracked here — they never cross the postMessage boundary.
   */
  recordDrawTime: (tick: number, ms: number) => void;
  getPerformance: () => readonly TickPerformance[];

  destroy: () => void;
};

const PERF_BUFFER_SIZE = 120;

export function createWorkerRunner<Data, Params>(
  worker: Worker,
  config: WorkerRunnerConfig<Params>
): WorkerRunner<Data, Params> {
  const listeners = new Set<(snapshot: State<Data, Params>) => void>();

  let currentSnapshot: State<Data, Params> = {
    data: undefined as Data,
    params: config.initialParams,
    tick: 0,
    status: 'idle',
    stepDurationMs: 0,
  };

  // Snapshots arrive throttled (snapshotIntervalMs in the worker), so this
  // buffer holds one entry per emitted snapshot — not per tick.
  const perfBuffer: TickPerformance[] = [];

  function send(msg: MainToWorkerMessage<Params>) {
    worker.postMessage(serializeMainMessage(msg));
  }

  function emit() {
    for (const l of listeners) {
      l(currentSnapshot);
    }
  }

  function pushPerf(snapshot: State<Data, Params>) {
    if (snapshot.tick <= 0) return;
    const last = perfBuffer[perfBuffer.length - 1];
    if (last && last.tick === snapshot.tick) return;
    if (perfBuffer.length >= PERF_BUFFER_SIZE) perfBuffer.shift();
    perfBuffer.push({ tick: snapshot.tick, stepMs: snapshot.stepDurationMs });
  }

  worker.onmessage = (event: MessageEvent) => {
    const msg = deserializeWorkerMessage<Data, Params>(event.data);

    switch (msg.kind) {
      case 'snapshot':
        currentSnapshot = msg.snapshot;
        pushPerf(msg.snapshot);
        emit();
        break;
      case 'error':
        currentSnapshot = { ...currentSnapshot, status: 'stopped' };
        emit();
        break;
      case 'ready':
        // Worker initialized, emit initial snapshot
        break;
    }
  };

  worker.onerror = () => {
    currentSnapshot = { ...currentSnapshot, status: 'stopped' };
    emit();
  };

  return {
    getSnapshot: () => currentSnapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    play: () => send({ kind: 'play' }),
    pause: () => send({ kind: 'pause' }),
    stop: () => send({ kind: 'stop' }),
    seek: (tick: number) => send({ kind: 'seek', tick }),
    advance: (count = 1) => send({ kind: 'advance', count }),
    setParams: (patch: Partial<Params>) =>
      send({ kind: 'setParams', patch }),
    resetWith: (patch?: Partial<Params>) =>
      send({ kind: 'resetWith', patch }),
    setConfig: (patch: Partial<WorkerConfig>) =>
      send({ kind: 'setConfig', patch }),

    recordDrawTime(tick, ms) {
      for (let i = perfBuffer.length - 1; i >= 0; i--) {
        if (perfBuffer[i].tick === tick) {
          perfBuffer[i].drawMs = ms;
          return;
        }
      }
    },
    getPerformance: () => perfBuffer,

    destroy() {
      listeners.clear();
      send({ kind: 'destroy' });
      worker.terminate();
    },
  };
}

/**
 * Wire protocol types for main ↔ worker communication.
 *
 * These types define the message shapes exchanged via postMessage.
 * The actual serialization boundary (where `unknown` and `as` casts live)
 * is in serialize.ts — not here.
 */

import type { State } from '../state';

/** Messages sent from the main thread to the worker. */
export type MainToWorkerMessage<Params, Input = never> =
  /**
   * `seed` is resolved on the main thread (random default generated there
   * when the consumer doesn't provide one) so the main thread always knows
   * it. Only the seed crosses the wire — the `SimRandom` it derives lives
   * worker-side.
   */
  | { kind: 'init'; params: Params; seed: number | string; config: WorkerConfig }
  | { kind: 'play' }
  | { kind: 'pause' }
  | { kind: 'stop' }
  | { kind: 'seek'; tick: number }
  | { kind: 'advance'; count: number }
  | { kind: 'setParams'; patch: Partial<Params> }
  | { kind: 'resetWith'; patch?: Partial<Params> }
  | { kind: 'setConfig'; patch: Partial<WorkerConfig> }
  /**
   * A transient perturbation event for `engine.send()` worker-side. Only the
   * input value — plain structured-cloneable data — crosses the wire; the
   * queue (and its `maxQueuedInputs` bound) lives in the worker engine,
   * mirroring how the seed crosses in `init` while the SimRandom lives
   * worker-side. Honest caveat: snapshots back to the main thread are
   * throttled, but inputs are never coalesced — every `send` becomes one
   * message and reaches the sim.
   */
  | { kind: 'input'; input: Input }
  | { kind: 'destroy' };

/** Messages sent from the worker to the main thread. */
export type WorkerToMainMessage<Data, Params> =
  | { kind: 'snapshot'; snapshot: State<Data, Params> }
  | { kind: 'error'; error: { message: string; stack?: string } };

/** Worker-specific configuration passed at init time. */
export type WorkerConfig = {
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  snapshotIntervalMs?: number;
  /** Bound on the worker engine's input queue — see `EngineConfig`. */
  maxQueuedInputs?: number;
};

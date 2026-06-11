/**
 * Wire protocol types for main ↔ worker communication.
 *
 * These types define the message shapes exchanged via postMessage.
 * The actual serialization boundary (where `unknown` and `as` casts live)
 * is in serialize.ts — not here.
 */

import type { State } from '../state';

/** Messages sent from the main thread to the worker. */
export type MainToWorkerMessage<Params> =
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
};

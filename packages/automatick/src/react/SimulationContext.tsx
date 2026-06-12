import React from 'react';
import type { SimulationStatus } from '../engine';

export type SimulationContextValue<Data, Params, Input = never> = {
  // State
  data: Data;
  params: Params;
  tick: number;
  status: SimulationStatus;
  /**
   * The resolved seed driving this simulation's `SimRandom` — the `seed`
   * prop when one was given, otherwise the random default recorded at mount.
   * Display or copy it to make a run reproducible.
   */
  seed: number | string;

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (tick: number) => void;
  advance: (count?: number) => void;
  setParams: (patch: Partial<Params>) => void;
  resetWith: (patch?: Partial<Params>) => void;
  /**
   * Queue a transient perturbation event (paint stroke, direction change,
   * cell toggle, …) for delivery to the next tick's `inputs`. An *action*
   * like `setParams`, not a toolkit member: component authors call `send`,
   * sim authors read `inputs`. When the sim declares no `Input` type this is
   * `(input: never) => void` — effectively uncallable, which is correct.
   * Inputs sent while `stopped` are dropped; see `SimulationEngine.send`.
   */
  send: (input: Input) => void;
};

/**
 * Runtime context value uses `unknown` for data/params since React.createContext
 * cannot be generic. The useSimulation hook casts to the correct types.
 */
type RuntimeContextValue = SimulationContextValue<unknown, unknown>;

export const SimulationContext =
  React.createContext<RuntimeContextValue | null>(null);

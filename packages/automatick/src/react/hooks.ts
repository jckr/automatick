import React from 'react';
import { SimulationContext } from './SimulationContext';
import type { SimulationContextValue } from './SimulationContext';
import type { SimModule } from '../sim';

/**
 * Helper type: extract Data, Params, and Input from a SimModule type, or use
 * them directly.
 *
 * Supports two usage patterns:
 *   useSimulation<typeof mySim>()                — infers Data, Params & Input
 *                                                  from the module
 *   useSimulation<MyData, MyParams, MyInput>()   — explicit type parameters
 *
 * `Input` defaults to `never`: for sims that declare no input type, `send`
 * is `(input: never) => void` — effectively uncallable, which is correct.
 */
type InferSimTypes<T, FallbackParams = unknown, FallbackInput = never> =
  T extends SimModule<infer D, infer P, infer I>
    ? SimulationContextValue<D, P, I>
    : SimulationContextValue<T, FallbackParams, FallbackInput>;

/**
 * Read simulation state and actions from the nearest `<Simulation>` provider.
 *
 * @example
 * // Infer types from the sim module:
 * const { data, tick, play, send } = useSimulation<typeof counterSim>();
 *
 * // Or provide types explicitly (worker mode):
 * const { data } = useSimulation<{ count: number }, { increment: number }>();
 */
export function useSimulation<
  T = unknown,
  FallbackParams = unknown,
  FallbackInput = never,
>(): InferSimTypes<T, FallbackParams, FallbackInput> {
  const ctx = React.useContext(SimulationContext);

  if (!ctx) {
    throw new Error('useSimulation must be used within a <Simulation>');
  }

  return ctx as InferSimTypes<T, FallbackParams, FallbackInput>;
}

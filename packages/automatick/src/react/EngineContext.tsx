import React from 'react';
import type { TickPerformance } from '../engine';
import type { State } from '../state';

/**
 * Internal context that exposes the engine's subscribe function directly.
 * Used by useSimulationCanvas to bypass React's render cycle for canvas updates,
 * and to record draw timing back to the engine's performance buffer.
 */
export type EngineContextValue = {
  subscribe: (
    listener: (snapshot: State<unknown, unknown>) => void
  ) => () => void;
  getSnapshot: () => State<unknown, unknown>;
  recordDrawTime: (tick: number, ms: number) => void;
  getPerformance: () => readonly TickPerformance[];
  /**
   * Register an element whose viewport visibility should gate the frame clock.
   * Present only when the surrounding `<Simulation>` has `pauseWhenHidden` set;
   * `useSimulationCanvas` calls it with its canvas so the adapter can freeze
   * ticks while the content is scrolled offscreen. Returns a cleanup that stops
   * observing the element. See `visibilityGate.ts`.
   */
  registerVisibilityTarget?: (el: Element) => () => void;
};

export const EngineContext = React.createContext<EngineContextValue | null>(
  null
);

import React from 'react';
import type { EngineSnapshot, TickPerformance } from '../engine';

/**
 * Internal context that exposes the engine's subscribe function directly.
 * Used by useSimulationCanvas to bypass React's render cycle for canvas updates,
 * and to record draw timing back to the engine's performance buffer.
 */
export type EngineContextValue = {
  subscribe: (
    listener: (snapshot: EngineSnapshot<unknown, unknown>) => void
  ) => () => void;
  getSnapshot: () => EngineSnapshot<unknown, unknown>;
  recordDrawTime: (tick: number, ms: number) => void;
  getPerformance: () => readonly TickPerformance[];
};

export const EngineContext = React.createContext<EngineContextValue | null>(
  null
);

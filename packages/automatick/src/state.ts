/**
 * The unified engine state shape — passed to `step`, returned by `getSnapshot`,
 * and delivered to the `render` callback. All three are operations on the
 * engine's inner state, so they share one type.
 */
export type State<Data, Params> = {
  data: Data;
  params: Params;
  tick: number;
  status: SimulationStatus;
  /** Duration of the previous step in ms. `0` before the first step has run. */
  stepDurationMs: number;
};

export type SimulationStatus = 'idle' | 'playing' | 'paused' | 'stopped';

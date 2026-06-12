import type { State } from './state';
import type { SimRandom } from './random';

/**
 * Engine-provided tools handed to `init` and `step` alongside the state.
 * Seeded randomness plus the inputs delivered for the current tick; future
 * capabilities will be added here without changing the `init`/`step`
 * signatures.
 *
 * `inputs` are the perturbation events delivered to this tick — everything
 * sent via `engine.send()` since the previous tick advance, in send order
 * (see engine.ts for delivery semantics). They are per-tick transients,
 * consumed once: they are not part of `State`, never appear in snapshots,
 * and never cross the worker wire as part of one. During `init`, `inputs`
 * is always the empty array.
 *
 * `Input` values must be structured-cloneable (same rule as `Data`) — in
 * worker mode each input crosses the `postMessage` boundary on its own.
 *
 * The toolkit is composed in at the call site only — it is not part of
 * `State`, never crosses the worker wire, and never appears in snapshots.
 */
export type SimToolkit<Input = never> = {
  random: SimRandom;
  inputs: readonly Input[];
};

/**
 * The argument `step` receives: the engine state snapshot plus the toolkit.
 * Author-facing call sites destructure it as
 * `{ data, params, tick, random, inputs }`.
 */
export type StepContext<Data, Params, Input = never> = State<Data, Params> &
  SimToolkit<Input>;

/**
 * Initial state for a simulation. Either a value of type `Data`, or a function
 * `(params, toolkit) => Data`. The function form is required when the initial
 * state depends on params or needs seeded randomness; otherwise pass the value
 * directly. The `toolkit` argument is optional to accept — one-arg
 * `(params) => Data` functions remain valid. The toolkit's `inputs` is always
 * the empty array at init time — inputs only ever arrive on ticks.
 *
 * `Data` itself must not be a function — it has to be structured-cloneable so
 * it can cross the worker boundary and be safely re-emitted on resetWith.
 * That's what makes this union unambiguous: a `function` value is always the
 * `(params, toolkit) => Data` branch.
 */
export type SimInit<Data, Params, Input = never> =
  | ((params: Params, toolkit: SimToolkit<Input>) => Data)
  | Data;

/**
 * Type guard that narrows a `SimInit` to its function branch. Defined as a
 * user-typed predicate so we can do the narrowing without an `as` cast.
 */
export function isInitFn<Data, Params, Input>(
  init: SimInit<Data, Params, Input>
): init is (params: Params, toolkit: SimToolkit<Input>) => Data {
  return typeof init === 'function';
}

/**
 * A simulation module: the pure business logic that automatick drives.
 *
 * `Input` is the type of transient perturbation events the sim accepts via
 * `engine.send()` / the React `send()` action (paint strokes, direction
 * changes, cell toggles, …). It defaults to `never` — a sim that declares no
 * input type cannot be sent anything. Params are persistent configuration;
 * inputs are consumed-once events: brush *size* is a param, brush *strokes*
 * are inputs.
 */
export type SimModule<Data, Params = Record<string, never>, Input = never> = {
  /**
   * Initial simulation state — value or `(params) => Data`. When a value is
   * passed, the engine takes a fresh `structuredClone` on every (re)init so
   * mutations inside `step` never leak across resets.
   */
  init: SimInit<Data, Params, Input>;

  /**
   * Advance the simulation by one tick. Must be pure and synchronous —
   * draw randomness from `ctx.random`, never `Math.random`, so runs are
   * reproducible from their seed. `ctx.inputs` holds the inputs delivered
   * to this tick (usually empty).
   */
  step: (ctx: StepContext<Data, Params, Input>) => Data;

  /**
   * Optional termination predicate. Checked after each step. If it returns
   * true, the simulation stops. Deliberately receives no toolkit —
   * termination must be a deterministic function of state.
   */
  shouldStop?: (data: Data, params: Params) => boolean;

  /**
   * Default parameter values. Optional — sims without tweakable params can
   * omit this. When omitted, `Params` defaults to `Record<string, never>` and
   * the engine seeds an empty params object.
   */
  defaultParams?: Params;
};

/**
 * Define a simulation module with full type inference.
 *
 * This is an identity function — it returns its argument unchanged. Its purpose is to
 * enable TypeScript to infer `Data` and `Params` from the `init` and `step` implementations,
 * so the developer never needs to annotate types inside those functions.
 *
 * @example
 * ```ts
 * export default defineSim<{ count: number }, { increment: number }>({
 *   defaultParams: { increment: 1 },
 *   init: (params) => ({ count: 0 }),
 *   step: ({ data, params }) => ({ count: data.count + params.increment }),
 * });
 * ```
 */
export function defineSim<Data, Params = Record<string, never>, Input = never>(
  sim: SimModule<Data, Params, Input>
): SimModule<Data, Params, Input> {
  return sim;
}

/** Extract the Data type from a SimModule. */
export type SimData<M> =
  M extends SimModule<infer D, infer _P, infer _I> ? D : never;

/** Extract the Params type from a SimModule. */
export type SimParams<M> =
  M extends SimModule<infer _D, infer P, infer _I> ? P : never;

/** Extract the Input type from a SimModule. */
export type SimInput<M> =
  M extends SimModule<infer _D, infer _P, infer I> ? I : never;

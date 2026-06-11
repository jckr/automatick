import type { State } from './state';
import type { SimRandom } from './random';

export type { SimRandom } from './random';

/**
 * Engine-provided tools handed to `init` and `step` alongside the state.
 * Currently just seeded randomness; future capabilities (e.g. recorded
 * inputs) will be added here without changing the `init`/`step` signatures.
 *
 * The toolkit is composed in at the call site only — it is not part of
 * `State`, never crosses the worker wire, and never appears in snapshots.
 */
export type SimToolkit = { random: SimRandom };

/**
 * The argument `step` receives: the engine state snapshot plus the toolkit.
 * Author-facing call sites destructure it as `{ data, params, tick, random }`.
 */
export type StepContext<Data, Params> = State<Data, Params> & SimToolkit;

/**
 * Initial state for a simulation. Either a value of type `Data`, or a function
 * `(params, toolkit) => Data`. The function form is required when the initial
 * state depends on params or needs seeded randomness; otherwise pass the value
 * directly. The `toolkit` argument is optional to accept — one-arg
 * `(params) => Data` functions remain valid.
 *
 * `Data` itself must not be a function — it has to be structured-cloneable so
 * it can cross the worker boundary and be safely re-emitted on resetWith.
 * That's what makes this union unambiguous: a `function` value is always the
 * `(params, toolkit) => Data` branch.
 */
export type SimInit<Data, Params> =
  | ((params: Params, toolkit: SimToolkit) => Data)
  | Data;

/**
 * Type guard that narrows a `SimInit` to its function branch. Defined as a
 * user-typed predicate so we can do the narrowing without an `as` cast.
 */
export function isInitFn<Data, Params>(
  init: SimInit<Data, Params>
): init is (params: Params, toolkit: SimToolkit) => Data {
  return typeof init === 'function';
}

/** A simulation module: the pure business logic that automatick drives. */
export type SimModule<Data, Params = Record<string, never>> = {
  /**
   * Initial simulation state — value or `(params) => Data`. When a value is
   * passed, the engine takes a fresh `structuredClone` on every (re)init so
   * mutations inside `step` never leak across resets.
   */
  init: SimInit<Data, Params>;

  /**
   * Advance the simulation by one tick. Must be pure and synchronous —
   * draw randomness from `ctx.random`, never `Math.random`, so runs are
   * reproducible from their seed.
   */
  step: (ctx: StepContext<Data, Params>) => Data;

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
export function defineSim<Data, Params = Record<string, never>>(
  sim: SimModule<Data, Params>
): SimModule<Data, Params> {
  return sim;
}

/** Extract the Data type from a SimModule. */
export type SimData<M> = M extends SimModule<infer D, infer _P> ? D : never;

/** Extract the Params type from a SimModule. */
export type SimParams<M> = M extends SimModule<infer _D, infer P> ? P : never;

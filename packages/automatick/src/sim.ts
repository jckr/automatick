import type { State } from './state';

/**
 * Initial state for a simulation. Either a value of type `Data`, or a function
 * `(params) => Data`. The function form is required when the initial state
 * depends on params; otherwise pass the value directly.
 *
 * `Data` itself must not be a function — it has to be structured-cloneable so
 * it can cross the worker boundary and be safely re-emitted on resetWith.
 * That's what makes this union unambiguous: a `function` value is always the
 * `(params) => Data` branch.
 */
export type SimInit<Data, Params> = ((params: Params) => Data) | Data;

/**
 * Type guard that narrows a `SimInit` to its function branch. Defined as a
 * user-typed predicate so we can do the narrowing without an `as` cast.
 */
export function isInitFn<Data, Params>(
  init: SimInit<Data, Params>
): init is (params: Params) => Data {
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

  /** Advance the simulation by one tick. Must be pure and synchronous. */
  step: (state: State<Data, Params>) => Data;

  /** Optional termination predicate. Checked after each step. If it returns true, the simulation stops. */
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

# automatick API Design Document

This document fully specifies the new automatick API. It is the single source of truth for implementation. If a task reveals ambiguity, revise this document before proceeding.

---

## 1. Mental Model

### What problem does automatick solve?

Building a tick-based simulation in React from scratch requires solving a surprising number of problems that have nothing to do with the simulation itself: managing a `requestAnimationFrame` loop with proper cleanup, coordinating play/pause/stop state, wiring up timing and delay, preventing unnecessary re-renders, and — if the computation is expensive — setting up web workers with a message protocol, serialization, and error handling. These are all solved problems, but solving them correctly every time is tedious and error-prone.

automatick exists so that a developer only needs to provide the parts that are unique to their simulation:

1. **`init`** — what's the initial state?
2. **`step`** — given the current state, what's the next state?
3. **Render** — how should the current state look on screen?
4. **Params** (optional) — what external settings can the user tweak?

Everything else — the loop, the timing, the state machine, the controls, the worker plumbing — is handled by the library. The API is successful if, for any reasonable tick-based simulation, using automatick is less work and less error-prone than writing it from scratch.

### Design principles

These principles guide every API decision in this document. When in doubt, choose the option that is simpler for the consumer, even if it makes the library internals harder.

- **Minimal concepts.** A developer learns four things: `defineSim` (describe the sim), `<Simulation>` (mount it), `useSimulation` (read from it), and optionally `<StandardControls>` (control it). Everything else is optional depth.
- **Business logic only.** The sim module (`init` + `step`) contains zero library concepts. No tagged unions, no status envelopes, no framework imports. A `step` function is just `(current state, params) → next state`. If you showed it to someone who'd never heard of automatick, they'd understand it immediately.
- **Progressive disclosure.** The simple case (counter, random walk) should require almost no code. Advanced features (workers, history, custom controls, termination) are opt-in and don't add complexity to the simple case.
- **One obvious way.** There is one `<Simulation>` component, one `useSimulation` hook, one way to define a sim. Switching from main-thread to worker is changing one prop, not learning a second API.
- **TypeScript works for you.** Types are inferred from `defineSim`, flow through the component and hook, and arrive at the render function fully resolved. The developer never writes a type annotation they shouldn't have to.

---

## 2. The Simple Case

A complete main-thread simulation in under 30 lines:

```tsx
// counterSim.ts
import { defineSim } from 'automatick/sim';

export default defineSim<{ count: number }, { increment: number }>({
  defaultParams: { increment: 1 },
  init: (params) => ({ count: 0 }),
  step: ({ data, params }) => ({ count: data.count + params.increment }),
});
```

```tsx
// CounterPage.tsx
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import counterSim from './counterSim';

function Display() {
  const { data, tick } = useSimulation<typeof counterSim>();
  return <div>Tick {tick}: count is {data.count}</div>;
}

export default function CounterPage() {
  return (
    <Simulation sim={counterSim}>
      <Display />
      <StandardControls />
    </Simulation>
  );
}
```

---

## 3. The Worker Case

Same sim module, one prop change:

```tsx
// CounterPage.tsx (worker version)
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';

function Display() {
  const { data, tick } = useSimulation<{ count: number }, { increment: number }>();
  return <div>Tick {tick}: count is {data.count}</div>;
}

export default function CounterPage() {
  return (
    <Simulation worker={() => import('./counterSim')}>
      <Display />
      <StandardControls />
    </Simulation>
  );
}
```

The sim module file is identical. Only the consuming component changes: `sim={counterSim}` becomes `worker={() => import('./counterSim')}`.

When using `worker`, the type parameter on `useSimulation` must be provided explicitly since the module is loaded asynchronously and TypeScript cannot infer its types from a dynamic import at the call site.

---

## 4. The Sim Module Contract

### `defineSim<Data, Params>(module): SimModule<Data, Params>`

An identity function that enables type inference. Returns its argument unchanged.

```ts
/** Engine-provided tools handed to init/step. Future capabilities are added here. */
type SimToolkit = { random: SimRandom };

/** What `step` receives: the state snapshot plus the toolkit, flattened. */
type StepContext<Data, Params> = State<Data, Params> & SimToolkit;

type SimInit<Data, Params> =
  | ((params: Params, toolkit: SimToolkit) => Data)
  | Data;

type SimModule<Data, Params = Record<string, never>> = {
  /**
   * Initial simulation state — either a value of type `Data`, or a function
   * `(params, toolkit) => Data`. Use the function form when init depends on
   * params or needs seeded randomness; otherwise pass the value directly.
   * The toolkit argument is optional to accept — one-arg `(params) => Data`
   * functions remain valid. Called once at engine creation and on resetWith().
   */
  init: SimInit<Data, Params>;

  /** Advance the simulation by one tick. Must be pure and synchronous. */
  step: (ctx: StepContext<Data, Params>) => Data;

  /** Optional termination predicate. Checked after each step. */
  shouldStop?: (data: Data, params: Params) => boolean;

  /**
   * Default parameter values. Optional — sims that don't have tweakable params
   * can omit this. When omitted, `Params` defaults to `Record<string, never>`
   * and the engine seeds an empty params object.
   */
  defaultParams?: Params;
};
```

`step`, `getSnapshot`, and the `render` callback all operate on the same engine state, so they share one type — `State<Data, Params>`. See section 7. `State` itself is unchanged by the toolkit: it remains the serializable snapshot/wire type. The toolkit is composed in at the `step` call site only (`StepContext = State & SimToolkit`) — it never crosses `postMessage` and never appears in `getSnapshot()`. Author-facing call sites read naturally: `step({ data, params, tick, random })`.

`shouldStop` deliberately does **not** receive the toolkit — termination must be a deterministic function of state.

`Data` must be structured-cloneable: it crosses the worker boundary via `postMessage` and the engine `structuredClone`s data-form `init` values on every (re)init. As a consequence, `Data` must not itself be a function.

**Why this shape:**

The sim module is the part the developer writes most often and stares at most. It must contain only business logic — no library ceremony, no framework imports beyond `defineSim` itself.

- `step` returns `Data` directly — no tagged union, no status envelope. A step function is just a pure transformation: `(state, params) → next state`. Someone unfamiliar with automatick can read it and understand what the simulation does.
- `init` accepts a value or a function. Sims whose initial state doesn't depend on params (`init: { angle: 0, pulses: [] }`) skip the `() =>` wrapper; sims that need params still get the function form.
- `shouldStop` is a separate optional predicate, not a return value from `step`. This keeps `step` clean — it only answers "what's next?", not "should we keep going?". Most sims don't need termination logic at all.
- `step` is synchronous. Async computation belongs in a worker, where `step` runs synchronously on the worker thread. The developer doesn't need to think about promises or cancellation.
- `defineSim` is the only way to create a sim module. One obvious way.

---

## 5. The `<Simulation>` Component API

One component, three mutually exclusive modes — `sim={module}`, `worker={loader}`, or the sim parts inline as props:

```ts
type SimulationPropsCommon<Params> = {
  params?: Partial<Params>;
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  autoplay?: boolean;
  children?: React.ReactNode;
};

// Main-thread mode (pre-built module)
type SimulationPropsLocal<Data, Params> = SimulationPropsCommon<Params> & {
  sim: SimModule<Data, Params>;
  worker?: never;
  init?: never;
  step?: never;
  shouldStop?: never;
  defaultParams?: never;
};

// Worker mode
type SimulationPropsWorker<Data, Params> = SimulationPropsCommon<Params> & {
  sim?: never;
  worker: () => Promise<{ default: SimModule<Data, Params> }>;
  init?: never;
  step?: never;
  shouldStop?: never;
  defaultParams?: never;
  snapshotIntervalMs?: number;
};

// Inline mode — sim parts as props, no module wrapper
type SimulationPropsInline<Data, Params> = SimulationPropsCommon<Params> & {
  sim?: never;
  worker?: never;
  init: SimInit<Data, Params>;
  step: (state: State<Data, Params>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  defaultParams?: Params;
};

type SimulationProps<Data, Params = Record<string, never>> =
  | SimulationPropsLocal<Data, Params>
  | SimulationPropsWorker<Data, Params>
  | SimulationPropsInline<Data, Params>;
```

**Inline form (simplest case).** When a sim has no reuse value beyond a single page and won't run in a worker, the `defineSim` wrapper is overhead. Skip it and pass the parts directly:

```tsx
<Simulation
  init={{ count: 0 }}
  step={({ data }) => ({ count: data.count + 1 })}
>
  <Display />
</Simulation>
```

The inline form is main-thread only — worker mode requires a module file the bundler can split.

**Dispatch precedence.** The component checks props in order: `worker` first, then `sim`, then falls through to inline. The `?: never` discriminators on each branch make all three forms mutually exclusive at the type level.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sim` | `SimModule<Data, Params>` | — | Sim module for main-thread execution. Mutually exclusive with `worker`. |
| `worker` | `() => Promise<{ default: SimModule }>` | — | Dynamic import loader for worker execution. Mutually exclusive with `sim`. |
| `params` | `Partial<Params>` | — | Override params (merged with `defaultParams`). Live-applied via `setParams` on change. |
| `maxTime` | `number` | `undefined` | If set, engine stops when tick reaches this value. |
| `delayMs` | `number` | `0` | Minimum wall-clock milliseconds between tick advances. |
| `ticksPerFrame` | `number` | `1` | How many ticks to advance per animation frame (main-thread) or timer call (worker). |
| `snapshotIntervalMs` | `number` | `16` | Worker only. Minimum interval between snapshot messages to main thread. |
| `autoplay` | `boolean` | `false` | If true, start playing immediately on mount. |
| `children` | `ReactNode` | — | Child components that consume simulation state via hooks. |

**Lifecycle semantics:**
- `sim`/`worker` and `defaultParams` are captured at mount. To reset the simulation with a new module, change the component's `key`.
- When the `params` prop changes, the component calls `engine.setParams(nextParams)` — a live update, not a re-init.
- To reset via params, call `resetWith()` from the `useSimulation` hook.
- To force a full remount with new structure, change the component's `key`.

---

## 6. The Hook API

### `useSimulation<Data, Params>()`

Returns simulation state and actions from the nearest `<Simulation>` provider.

```ts
type UseSimulationReturn<Data, Params> = {
  // State
  data: Data;
  params: Params;
  tick: number;
  status: SimulationStatus;

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (tick: number) => void;
  advance: (count?: number) => void;
  setParams: (patch: Partial<Params>) => void;
  resetWith: (patch?: Partial<Params>) => void;
};

type SimulationStatus = 'idle' | 'playing' | 'paused' | 'stopped';
```

**Type inference shortcut:** When using `sim` prop (main-thread), the hook can accept the sim module type directly:

```ts
// Instead of useSimulation<{ count: number }, { increment: number }>()
const { data } = useSimulation<typeof counterSim>();
// data is inferred as { count: number }
```

This works via a conditional type that extracts `Data` and `Params` from `SimModule<Data, Params>`.

### `useSimulationHistory<Data>(policy?)`

Opt-in history recording. When this hook is mounted, the engine begins retaining tick snapshots. When unmounted, recording stops.

```ts
type HistoryPolicy =
  | { type: 'all' }
  | { type: 'lastN'; count: number };

type UseSimulationHistoryReturn<Data> = {
  history: ReadonlyArray<{ tick: number; data: Data }>;
};
```

**Default policy:** `{ type: 'all' }`.

**Implementation:** The hook registers a history listener with the engine on mount. The engine only allocates history storage when at least one listener is registered. When the last history listener unsubscribes, the engine drops its history buffer.

---

## 7. The Engine API

### `createEngine<Data, Params>(config): SimulationEngine<Data, Params>`

```ts
type EngineConfig<Data, Params = Record<string, never>> = {
  /** Value or `(params, toolkit) => Data`. See SimInit in section 4. */
  init: SimInit<Data, Params>;
  step: (ctx: StepContext<Data, Params>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  /** Optional — when omitted, the engine seeds `params` with `{}`. */
  initialParams?: Params;
  /**
   * Seed for the engine's SimRandom. Number or string. When omitted, the
   * engine picks a random numeric seed at construction and records it —
   * `getSeed()` always returns the seed that reproduces the run.
   */
  seed?: number | string;
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  /** Optional render callback — sugar for `subscribe` + initial paint, scoped to the vanilla path. */
  render?: (snapshot: State<Data, Params>) => void;
  /**
   * Drive `handleAnimationFrame` from an internal `requestAnimationFrame` loop. Defaults to `true`
   * so vanilla callers don't have to write the loop. The React adapter and worker host pass `false`
   * because they own the frame loop or run where rAF doesn't exist. Loop is created at construction
   * and torn down by `destroy()`. Silently a no-op when `globalThis.requestAnimationFrame` is missing.
   */
  autoFrame?: boolean;
};

type State<Data, Params> = {
  data: Data;
  params: Params;
  tick: number;
  status: SimulationStatus;
  /** Duration of the previous step in ms. `0` before the first step has run. */
  stepDurationMs: number;
};

type SimulationEngine<Data, Params> = {
  getSnapshot: () => State<Data, Params>;
  /** The seed driving this engine's SimRandom — configured or recorded default. */
  getSeed: () => number | string;
  subscribe: (listener: (snapshot: State<Data, Params>) => void) => () => void;
  subscribeHistory: (listener: (entry: { tick: number; data: Data }) => void) => () => void;

  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (tick: number) => void;
  advance: (count?: number) => void;
  setParams: (patch: Partial<Params>) => void;
  resetWith: (patch?: Partial<Params>) => void;

  handleAnimationFrame: (nowMs: number) => void;
  destroy: () => void;
};
```

**Eager initialization:** `createEngine()` invokes `init` immediately (calling the function or cloning the value). The returned engine is snapshot-ready. There is no lazy path, no `didInit` guard.

**Data-form init cloning:** When `init` is a value, the engine `structuredClone`s it once at construction (so later mutations to the source can't leak in) and again on every (re)init (so step mutations don't persist across resets).

**`render` config option (vanilla DX sugar):** When `config.render` is provided, the engine subscribes it as a listener and invokes it once with the initial state at construction time. From then on it fires on every emit, identically to a manually-wired `subscribe(render)`. This eliminates the two-line boilerplate (`engine.subscribe(render); render(engine.getSnapshot())`) for callers who don't have another reactive layer driving rendering. `subscribe` remains the lower-level primitive; React adapter and worker callers wire their own subscribers explicitly and should not pass `render`.

### Seeded randomness & determinism

The engine derives one `SimRandom` per run from `config.seed` (a vendored
splitmix32 PRNG; string seeds are hashed to a 32-bit int) and hands it to
`init` and `step`. The rules that make runs reproducible:

- **Same-seed reset semantics.** `resetWith()` re-derives the generator from
  the same seed, so a reset replays the original run exactly. This is a
  resolved design decision: reset means "run it again", not "run a different
  one". To get a different run, construct a new engine (or remount
  `<Simulation>` via `key`) with a different seed.
- **The recorded-default-seed trick.** When `seed` is omitted, the engine picks
  a random numeric seed at construction and *records* it. `getSeed()` returns
  it, so any run — even an unseeded one — can be reproduced after the fact by
  passing the recorded seed back in. In worker mode the default seed is
  resolved on the main thread before the init message, so the main thread
  always knows it (exposed as `seed` on the React context).
- **Per-JS-engine reproducibility caveat.** The PRNG itself is exact integer
  arithmetic and bit-identical everywhere, but transcendental `Math`
  functions (`Math.sin`, `Math.exp`, `Math.pow`, …) are implementation-defined
  and may differ in the last ulp across JS engines. Same seed + same JS engine
  ⇒ bit-identical run; across engines, sims using transcendentals may diverge.
- **Sim-authoring rule.** A sim is only as deterministic as its inputs: draw
  all randomness from the toolkit's `random` (never `Math.random`) and avoid
  ambient nondeterminism — `Date.now()`, `performance.now()`, locale- or
  environment-dependent APIs — inside `init`/`step`.

Deferred (out of scope for now): a `reseed()` API, replay/backward-seek, and
input recording.

### State Machine

```
         ┌─────────────────────────────────────────┐
         │                                         │
         ▼                                         │
      ┌──────┐   play()   ┌─────────┐             │
 ──►  │ idle │ ─────────► │ playing │             │
      └──────┘            └─────────┘             │
                            │  │  │               │
                   pause()  │  │  │ shouldStop()  │
                   seek()   │  │  │ stop()        │
                            ▼  │  ▼               │
                     ┌────────┐│ ┌─────────┐      │
                     │ paused ││ │ stopped │      │
                     └────────┘│ └─────────┘      │
                       │  ▲    │      │           │
                       │  │    │      │resetWith()│
              play()   │  │    │      ├───────────┘
                       │  │seek()     │
                       │  │advance()  │
                       │  │    │      │
                       ▼  │    │      │
                     (stays    │      │
                      paused)  │      │
                               │      │
                               └──────┘
```

**Transition table:**

| From | Action | To | Notes |
|------|--------|----|-------|
| `idle` | `play()` | `playing` | Starts the animation loop. |
| `idle` | `pause()` | `idle` | No-op. |
| `idle` | `stop()` | `idle` | No-op. |
| `idle` | `seek(n)` | `paused` | Advances to tick n, pauses. |
| `idle` | `advance(n)` | `paused` | Advances n ticks, stays paused. |
| `playing` | `pause()` | `paused` | Stops the loop, preserves state. |
| `playing` | `stop()` | `stopped` | Terminates. State preserved, read-only. |
| `playing` | `seek(n)` | `paused` | Seeking always pauses. |
| `playing` | `shouldStop` returns true | `stopped` | Checked after each step. |
| `playing` | tick reaches `maxTime` | `stopped` | Automatic termination. |
| `paused` | `play()` | `playing` | Resumes from current tick. |
| `paused` | `stop()` | `stopped` | Terminates. |
| `paused` | `seek(n)` | `paused` | Jumps to tick, stays paused. |
| `paused` | `advance(n)` | `paused` | Advances n ticks, stays paused. |
| `stopped` | `play()` | `stopped` | **No-op.** Log a console warning. |
| `stopped` | `pause()` | `stopped` | No-op. |
| `stopped` | `seek(n)` | `stopped` | No-op. Cannot seek from stopped. |
| `stopped` | `resetWith(patch?)` | `idle` | Merges patch with current params, calls `init()`. Only way out of stopped. |
| any | `setParams(patch)` | (unchanged) | Live merge. Does not change status. |
| any | `resetWith(patch?)` | `idle` | Merges patch with current params (or uses current params if no patch), calls `init()`, resets tick to 0. |

**`resetWith` during `playing`:** Transitions to `idle`, not back to `playing`. Consumer calls `play()` themselves if they want to resume. Predictable over magical.

**`setParams` vs `resetWith`:**
- `setParams(patch)` — merges `patch` with current params. Does not call `init()`. Does not change status. The next `step` sees the updated params.
- `resetWith(patch?)` — merges optional `patch` with current params, calls `init(mergedParams)`, resets tick to 0, transitions to `idle`.
- Both use the same merge semantics: `{ ...currentParams, ...patch }`.

---

## 8. The Worker Wire Format

The worker is a black box that produces snapshots on its own schedule. Communication uses structured `postMessage`.

### Main → Worker messages

```ts
type MainToWorkerMessage =
  // `seed` is resolved on the main thread (random default generated there
  // when absent) so the main thread always knows it. Only the seed — plain
  // data — crosses the wire; the SimRandom it derives lives worker-side.
  | { kind: 'init'; params: Params; seed: number | string; config: WorkerConfig }
  | { kind: 'play' }
  | { kind: 'pause' }
  | { kind: 'stop' }
  | { kind: 'seek'; tick: number }
  | { kind: 'advance'; count: number }
  | { kind: 'setParams'; patch: Partial<Params> }
  | { kind: 'resetWith'; patch?: Partial<Params> }
  | { kind: 'destroy' };

type WorkerConfig = {
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  snapshotIntervalMs?: number;
};
```

### Worker → Main messages

```ts
type WorkerToMainMessage<Data, Params> =
  | { kind: 'snapshot'; snapshot: State<Data, Params> }
  | { kind: 'error'; error: { message: string; stack?: string } }
  | { kind: 'ready' };
```

### Wire boundary typing

This is the **only** place in the codebase where `unknown` and `as` casts are permitted.

```ts
// serialize.ts — the one file where wire casts live

/** Cast a typed snapshot to the wire format. Called in the worker before postMessage. */
export function serializeSnapshot<Data, Params>(
  snapshot: State<Data, Params>
): unknown {
  // postMessage uses structured clone; this cast marks the serialization boundary.
  return snapshot;
}

/** Cast the wire format back to a typed snapshot. Called on main thread after onmessage. */
export function deserializeSnapshot<Data, Params>(
  raw: unknown
): State<Data, Params> {
  // Structured clone preserves shape; this cast marks the deserialization boundary.
  return raw as State<Data, Params>;
}
```

Both functions have header comments explaining why the cast exists. No other file in the codebase uses `as` or `unknown`.

### Worker tick loop

The worker owns its own tick loop using `setTimeout`. It does **not** depend on main-thread `requestAnimationFrame`.

```
Worker loop:
  1. Run step() for ticksPerFrame ticks
  2. If snapshotIntervalMs has elapsed since last postMessage, emit snapshot
  3. setTimeout(loop, delayMs)
```

**Snapshot throttling:** Even if the worker ticks thousands of times per second, it only posts snapshots to the main thread at most once per `snapshotIntervalMs` (default 16ms, ~60fps). This prevents the main thread from drowning in messages. The worker always emits one final snapshot when it pauses or stops, regardless of throttle timing.

**`setTimeout(fn, 0)` in workers** has better behavior than on the main thread — no 4ms clamp, no render-loop interaction. For sims that want maximum speed, set `delayMs: 0`.

### Error propagation

If `step` or `init` throws inside the worker, the worker catches the error and posts a `{ kind: 'error', error: { message, stack } }` message. The main-thread component receives this and transitions to `stopped` status. The error is available via `useSimulation().error` (an optional field on the return type, present only when status is `stopped` due to an error).

---

## 9. Control Primitives

Controls are a major part of what makes automatick easier than building from scratch. Without the library, a developer has to wire up play/pause buttons to RAF loops, build range sliders that update params, handle disabled states based on simulation status, etc. `<StandardControls>` eliminates all of that — drop it in and it works. Individual primitives are available for custom layouts.

All controls read from the `useSimulation` hook. They are status-aware.

### Individual primitives

```tsx
<PlayPauseButton />        // Enabled in idle/paused. Shows "Pause" when playing.
<StopButton />             // Always enabled (no-op when already stopped/idle).
<StepButton ticks={1} />   // Enabled when paused or idle. Calls advance(ticks).
<ResetButton />            // Calls resetWith(). Always enabled.
<TickReadout />            // Displays current tick.
<TickSeekSlider max={100} /> // Range input. Calls seek(). Enabled when not stopped.
<ParamRangeField<P>        // Typed to Params. Calls setParams().
  param="fieldName"
  min={0} max={100} step={1}
  label="Field Name"
/>
<ParamToggleField<P>       // Typed to Params. Calls setParams().
  param="fieldName"
  label="Field Name"
/>
```

### `<StandardControls>`

Batteries-included control strip:

```tsx
<StandardControls
  controls={[
    { type: 'range', param: 'speed', min: 1, max: 10, label: 'Speed' },
    { type: 'toggle', param: 'wrap', label: 'Wrap edges' },
  ]}
  maxTime={200}
  showStepButton
  showResetButton
/>
```

### Status-aware disabled states

| Control | idle | playing | paused | stopped |
|---------|------|---------|--------|---------|
| Play/Pause | Play (enabled) | Pause (enabled) | Play (enabled) | Play (disabled) |
| Stop | disabled | enabled | enabled | disabled |
| Step | enabled | disabled | enabled | disabled |
| Reset | enabled | enabled | enabled | enabled |
| Seek slider | enabled | enabled | enabled | disabled |
| Param fields | enabled | enabled | enabled | enabled |

### Typing

`ParamRangeField` and `ParamToggleField` pick up `Params` from the context. The `param` prop is typed as `keyof Params & string`. No generic pass-through needed at call sites — the context provides the type.

---

## 10. Migration Notes

### Renaming

| Old | New |
|-----|-----|
| `initData(params, context?)` | `init(params)` |
| `updateData({ data, params, tick, cachedData, context })` | `step({ data, params, tick })` |
| `engine.stepOnce(count)` | `engine.advance(count)` |
| `config.initialParams` | `defaultParams` (in sim module) / `initialParams` (in engine config) |
| `config.ticksPerAnimation` | `ticksPerFrame` |
| `isPlaying` / `canPlay` | `status` (`'idle' | 'playing' | 'paused' | 'stopped'`) |
| `setParams(patch, { reset: true })` | `resetWith(patch)` |
| `setParams(patch, { reset: false })` | `setParams(patch)` |
| `UpdateResult<Data, Result>` (tagged union) | `Data` (plain return from `step`) |
| `{ status: 'complete', data, result }` | `shouldStop(data, params)` returning `true` |

### Dropped concepts

| Concept | Reason |
|---------|--------|
| `Result` generic / `results[]` / `onComplete` | Unnecessary complexity. Consumers track results in `Data` if needed. |
| `context` escape hatch | Opaque `unknown` bag. Use closure or module scope instead. |
| `cachedData` in step args | Leaky abstraction. History is now consumer-opt-in via hook. |
| `loop` config | Consumers call `resetWith()` + `play()` in a `shouldStop` callback or effect. |
| `noCache` config | No cache in engine. History is external. |
| `WorkerSimulation` / `WorkerRenderSimulation` | Unified into single `<Simulation>` with `worker` prop. |
| `selectRenderState` / `OffscreenCanvas` / `canvasLeases` | Cut entirely. Render on main thread from snapshot data. |
| `SimulationContextRuntimeValue` (untyped runtime shape) | Context is properly generic. |

### Example migration: Game of Life

**Before:**
```ts
import type { UpdateResult } from 'automatick/types';

export function initData(params: GameOfLifeParams): GameOfLifeData { ... }

export function updateGameOfLifeGrid(args: {
  data: GameOfLifeData;
  params: GameOfLifeParams;
}): UpdateResult<GameOfLifeData> {
  // ...
  if (changes === 0) return { status: 'complete', data: updatedGrid };
  return { status: 'continue', data: updatedGrid };
}
```

**After:**
```ts
import { defineSim } from 'automatick/sim';

export default defineSim<GameOfLifeData, GameOfLifeParams>({
  defaultParams: { height: 40, width: 40, density: 0.3 },
  init: (params) => { /* same logic */ },
  step: ({ data, params }) => { /* same logic, returns Data directly */ },
  shouldStop: (data) => {
    // Check if grid is static (replaces the 'complete' return)
    return data.every((row, y) => row.every((cell, x) => /* no changes */ ));
  },
});
```

---

## 11. Resolution of Open Questions

### Q1: Shape of the `worker` prop
**Decision:** `() => import('./sim')` (dynamic import returning `{ default: SimModule }`).

**Rationale:** This is the standard Vite/webpack code-splitting pattern. The bundler handles creating the worker entry. A `new URL()` variant adds complexity without benefit for this use case.

### Q2: Worker wire format
**Decision:** Structured `postMessage` with discriminated unions (see Section 8).

**Rationale:** Simple, debuggable, no serialization library needed. Structured clone handles all reasonable `Data` shapes.

### Q3: `setParams`/`resetWith` behavior mid-playback
**Decision:** `setParams` does not change status (next tick sees new params). `resetWith` always transitions to `idle`.

**Rationale:** `setParams` is a live tweak — pausing would break interactive param sliders. `resetWith` is explicitly "start over" — keeping playback would be surprising.

### Q4: Can `step` be async?
**Decision:** No. `step` is synchronous.

**Rationale:** Async step would complicate the engine loop, require cancellation logic, and create ambiguous state during await. Expensive computation belongs in a worker, where `step` runs synchronously on the worker thread.

### Q5: How the history hook subscribes without forcing recording
**Decision:** `subscribeHistory` method on the engine. When the first history listener subscribes, the engine starts recording entries. When the last unsubscribes, it stops and drops the buffer.

**Rationale:** Zero cost when unused. The engine doesn't need to know about React — it just tracks whether anyone is listening.

### Q6: RAF loop ownership
**Decision:** Main-thread mode: React component owns RAF (via `useEffect`). Worker mode: worker owns its own `setTimeout` loop.

**Rationale:** Main-thread sims should sync with the browser's render cycle. Workers don't have RAF and shouldn't depend on main-thread timing. The component in worker mode is a passive snapshot subscriber, not a tick driver.

---

## 12. Toolkit Convention & the Canvas View Toolkit

### The convention: injected, never imported

Author-written functions (`step`, draw callbacks) receive their helpers as **injected capability bags** — extra arguments supplied by the library — never as imports and never as return values. A draw function is `(ctx, snapshot, view) => void`: the `view` bag arrives as the third argument, exactly like `ctx` and `snapshot` do. The author's file imports nothing from the library to use the toolkit.

Why injection:

- **The function stays portable.** A draw function that closes over imported helpers or module state is welded to the environment it was written in. One that only consumes its arguments can be relocated — including, eventually, to a worker.
- **The library controls lifetime and identity.** Caches (theme reads, blit buffers) and observers live in the attachment that created the bag, are shared across frames, and are torn down on detach. An imported helper has no attachment to belong to.
- **Discoverability.** Typing `view.` in an editor enumerates the whole toolkit. There is no second place to look.

One `CanvasView` object exists per attachment — stable identity, fields (`width`, `height`, `dpr`) mutated in place on resize/dpr change. Helpers never leak context state: anything they touch (`fillStyle`, `globalAlpha`, `imageSmoothingEnabled`, the transform) is restored before the author's next statement runs.

### The two-tier inclusion test

A member earns its place in the bag in one of two ways:

1. **Capabilities** — the recipe is a correctness trap. If the obvious hand-written version is subtly wrong (wrong on zoom, wrong on theme switch, wrong on resize, leaks state), the library must own it. `theme()` is the canonical case: the naive `getComputedStyle` read is easy, but *redrawing a paused sim when the theme flips* is the part everyone forgets — so the canvas stays stale after a light/dark switch. Same for DPR ownership (`width × dpr` backing store + transform + `resolution:` media-query re-arm) and `blitGrid` (offscreen canvas + ImageData caching keyed by dimensions, smoothing toggled and restored).
2. **Conveniences** — pure compositions of bag members that appear in essentially every sim. `clear()` and `fade()` are one-liners over `ctx` + `view.width/height`, but every single demo writes them, and `fade` has a state-leak footgun (`globalAlpha`) attached.

Anything that fails both tests stays out.

### Rejected: shape helpers

There is no `view.circle()`, `view.line()`, or any drawing-vocabulary helper — and this is a deliberate reversal of precedent: the original library shipped a circle helper, and it was dropped. `ctx.arc()` is not a correctness trap; wrapping it saves zero bugs and starts an unbounded vocabulary (circle, then triangle, then arrow, then text-with-outline…). The 2D context *is* the drawing vocabulary. The bag only contains what the context can't safely express on its own.

### Values, not DOM reads

View helpers may depend only on the drawing context and on **values** (`width`, `height`, `dpr`, resolved theme strings). The author's draw function must never be forced into a direct DOM read (`getComputedStyle`, element measurement, `window.devicePixelRatio`). Where a DOM read is genuinely needed — theme variables — the *library* performs it, caches the resolved value, and hands the author a string.

This is what keeps OffscreenCanvas rendering reachable: a draw function whose inputs are a context, a snapshot, and a bag of plain values can run anywhere a 2D context exists, including a worker where `document` does not. The main thread would resolve the values (size, dpr, theme strings) and ship them across; the draw function wouldn't change. A single sneaky `getComputedStyle` inside a draw function forecloses that path.

### React/DOM mode gets no view toolkit

`useSimulation()` rendering (JSX output) deliberately has no equivalent bag. CSS *is* the toolkit there: theme variables apply via ordinary cascade, the browser handles DPR, "clear" is reconciliation. Injecting a helper bag into JSX rendering would duplicate the platform. The view toolkit exists precisely because a 2D canvas context has none of those affordances built in.

### Per-mode placement

| Mode | How the sim runs | How drawing attaches | View toolkit |
|------|------------------|----------------------|--------------|
| Plain JS / vanilla | `createEngine()` | `attachCanvas(engine, canvas, draw, { width, height })` from `automatick/canvas` | Yes — injected `view` |
| React canvas | `<Simulation>` | `useSimulationCanvas(draw, { width, height })` — a thin wrapper over `attachCanvas` | Yes — injected `view` |
| React DOM | `<Simulation>` | `useSimulation()` + JSX | No — CSS is the toolkit |
| Worker | sim steps in the worker; drawing stays on the main thread | same as React canvas / plain JS (the runner satisfies the same `CanvasSource` interface) | Yes — on the main thread |
| Worker (future, OffscreenCanvas) | sim and draw both in worker | not yet implemented | Reachable because of the values-not-DOM-reads rule |

The core lives framework-free in `automatick/canvas` (DOM, no React): `attachCanvas(source, canvas, draw, options) => detach`. `source` is a minimal structural interface — `{ subscribe, getSnapshot, recordDrawTime? }` — satisfied by `SimulationEngine`, the worker runner, and the React engine context, so every mode funnels through one implementation. The React hook adds nothing but ref plumbing and effect lifetime. Inside the worker itself there is no view toolkit — `step` gets the engine-side toolkit only; rendering concerns never enter the sim module.

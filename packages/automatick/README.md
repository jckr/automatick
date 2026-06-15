# automatick

State-machine engine for tick-based simulations in React. You write the rules (`init`, `step`, params); automatick handles the loop, timing, status state machine, controls, and (optionally) running the simulation in a Web Worker.

## Install

```bash
npm install automatick
```

React is an optional peer dependency — the engine has no React surface.

## Quick start

A simulation has three parts: a **sim module** (pure logic), a `<Simulation>` wrapper, and a render component reading state via `useSimulation()`.

```ts
// counterSim.ts
import { defineSim } from 'automatick/sim';

export default defineSim<{ count: number }, { increment: number }>({
  defaultParams: { increment: 1 },
  init: () => ({ count: 0 }),
  step: ({ data, params }) => ({ count: data.count + params.increment }),
});
```

```tsx
// Counter.tsx
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { StandardControls } from 'automatick/react/controls';
import counterSim from './counterSim';

function Display() {
  const { data, tick } = useSimulation<typeof counterSim>();
  return <p>Tick {tick}: count is {data.count}</p>;
}

export default function Counter() {
  return (
    <Simulation sim={counterSim}>
      <Display />
      <StandardControls />
    </Simulation>
  );
}
```

`StandardControls` gives you play/pause and a reset button out of the box; pass `showStepButton`, a finite `maxTime` (for the seek slider), and `controls` to add the step button, seek, and parameter inputs. For finer control, individual primitives live at `automatick/react/control-primitives`.

## Web worker

Same sim module, one prop change — the simulation now runs off the main thread. The `worker` prop takes a module **URL** (or string), not the module itself; the Vite idiom is `new URL('./sim.ts', import.meta.url)`. Since a URL carries no type information, pass `Data`/`Params` explicitly:

```tsx
<Simulation<{ count: number }, { increment: number }>
  worker={new URL('./counterSim.ts', import.meta.url)}
>
  <Display />
  <StandardControls />
</Simulation>
```

Useful when `step` is expensive (large grids, n-body simulations, fluid solvers) and you want the UI to stay responsive.

## API at a glance

`defineSim<Data, Params, Input?>({ init, step, shouldStop?, defaultParams? })` declares a sim module. `defaultParams` is optional; the third `Input` generic types transient events delivered via `send()` (see below) and defaults to `never`.

`step` receives `{ data, params, tick, status, stepDurationMs, random, inputs }` and returns the next `Data`. Draw all randomness from `random` (`random()`, `random.int`, `random.pick`) rather than `Math.random` so runs replay from their seed. `inputs` holds the events delivered to this tick.

`init` is either a value or `(params, { random }) => Data`, and `shouldStop(data, params) => boolean` is an optional terminal predicate; the engine moves to `'stopped'` when it returns true.

`useSimulation<typeof sim>()` returns the current snapshot and actions:

| Field | Type | Description |
|---|---|---|
| `data` | `Data` | Current simulation state |
| `params` | `Params` | Current parameters |
| `tick` | `number` | Current tick (starts at 0) |
| `status` | `'idle' \| 'playing' \| 'paused' \| 'stopped'` | Engine status |
| `seed` | `number \| string` | Resolved seed driving the run (read back the auto-generated one to reproduce a run) |
| `play()`, `pause()`, `stop()` | `() => void` | Lifecycle controls |
| `seek(tick)` | `(n: number) => void` | Jump forward; pauses |
| `advance(n?)` | `(n?: number) => void` | Step forward by `n` ticks (default 1) |
| `setParams(patch)` | `(patch: Partial<Params>) => void` | Update params without reinit |
| `resetWith(patch?)` | `(patch?: Partial<Params>) => void` | Re-run `init` with optional param patch |
| `send(input)` | `(input: Input) => void` | Queue a transient event for the next tick's `inputs` |

## Package entry points

| Subpath | Exports |
|---|---|
| `automatick` | `createEngine`, engine + status types |
| `automatick/sim` | `defineSim`, `SimModule`, `SimData`, `SimParams`, `SimInput` |
| `automatick/random` | `SimRandom` seeded RNG types |
| `automatick/canvas` | `attachCanvas` (framework-free), `CanvasView` toolkit |
| `automatick/worker/runner` | Worker-side runtime |
| `automatick/worker/create` | Worker host factory |
| `automatick/worker/protocol` | Message protocol types |
| `automatick/react/simulation` | `<Simulation>` |
| `automatick/react/hooks` | `useSimulation()` |
| `automatick/react/controls` | `<StandardControls>` |
| `automatick/react/control-primitives` | Individual UI primitives |
| `automatick/react/canvas` | `useSimulationCanvas()` |
| `automatick/react/performance` | `<PerformanceOverlay>` |
| `automatick/react/context` | `<SimulationContext>` |

All entry points use named exports. If you'd rather have a single namespace object, use `import * as Automatick from 'automatick'` and call `Automatick.createEngine(...)` — same for any subpath.

## License

MIT

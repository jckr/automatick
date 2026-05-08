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

`StandardControls` gives you play/pause, reset, step, seek, and parameter inputs out of the box. For finer control, individual primitives live at `automatick/react/control-primitives`.

## Web worker

Same sim module, one prop change — the simulation now runs off the main thread:

```tsx
<Simulation worker={() => import('./counterSim')}>
  <Display />
  <StandardControls />
</Simulation>
```

Useful when `step` is expensive (large grids, n-body simulations, fluid solvers) and you want the UI to stay responsive.

## API at a glance

`defineSim<Data, Params>({ init, step, shouldStop?, defaultParams })` declares a sim module.

`step` receives `{ data, params, tick }` and returns the next `Data`.

`shouldStop(data, params) => boolean` is an optional terminal predicate; the engine moves to `'stopped'` when it returns true.

`useSimulation<typeof sim>()` returns the current snapshot and actions:

| Field | Type | Description |
|---|---|---|
| `data` | `Data` | Current simulation state |
| `params` | `Params` | Current parameters |
| `tick` | `number` | Current tick (starts at 0) |
| `status` | `'idle' \| 'playing' \| 'paused' \| 'stopped'` | Engine status |
| `play()`, `pause()`, `stop()` | `() => void` | Lifecycle controls |
| `seek(tick)` | `(n: number) => void` | Jump forward; pauses |
| `advance(n?)` | `(n?: number) => void` | Step forward by `n` ticks (default 1) |
| `setParams(patch)` | `(patch: Partial<Params>) => void` | Update params without reinit |
| `resetWith(patch?)` | `(patch?: Partial<Params>) => void` | Re-run `init` with optional param patch |

## Package entry points

| Subpath | Exports |
|---|---|
| `automatick` | `createEngine`, engine + status types |
| `automatick/sim` | `defineSim`, `SimModule`, `SimData`, `SimParams` |
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

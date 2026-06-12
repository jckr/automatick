# automatick docs — Agent Guide

This repository is the **automatick documentation site**: a gallery of live
simulation examples built with the automatick library. Most work here means
**adding or editing an example**.

> **First time building a simulation with automatick?**
> Read [`packages/automatick/AGENTS.md`](./packages/automatick/AGENTS.md) — the
> self-contained guide to the library (defining sims, the rendering flavors, the
> `<Simulation>` API, and canvas rendering patterns). This guide assumes that
> knowledge and only covers what's specific to the docs site: file conventions,
> wiring an example into the site, and the docs-only helper components.

## Repository Layout

```
packages/automatick/         — The library (npm package) — see its AGENTS.md
apps/automatick-docs/         — Documentation site (Vite + React)
  src/sims/                   — Simulation logic files (*Sim.ts)
  src/demos/                  — Demo React components (*Demo.tsx + *.module.css)
  src/pages/examples/         — Page wrappers (*Page.tsx)
  src/components/             — Shared docs-site components (CanvasStage, DemoSplit, …)
  src/layout/                 — Shell, sidebar, routing
```

## Adding a New Example — Checklist

### Files to create

1. **`apps/automatick-docs/src/sims/myExampleSim.ts`** — simulation logic
2. **`apps/automatick-docs/src/demos/MyExampleDemo.tsx`** — demo React component
3. **`apps/automatick-docs/src/demos/MyExampleDemo.module.css`** — styles
4. **`apps/automatick-docs/src/pages/examples/MyExamplePage.tsx`** — page wrapper

### Files to modify

5. **`apps/automatick-docs/src/App.tsx`** — add import + `<Route>` under `<ShellRoute variant='playground'>`
6. **`apps/automatick-docs/src/layout/Sidebar.tsx`** — add an entry to the `EXAMPLES` array (this is the table of contents)

### 1. Simulation file (`src/sims/myExampleSim.ts`)

A standard `defineSim` module — see the library guide for the rules on `init`,
`step`, `shouldStop`, randomness, and inputs. Export the `Data`/`Params` types
if the demo component needs them for explicit typing.

```ts
import { defineSim } from 'automatick/sim';

export type MyData = { /* ... */ };
export type MyParams = { /* ... */ };

export default defineSim<MyData, MyParams>({
  defaultParams: { /* ... */ },
  init: (params, { random }) => { /* ... */ },
  step: ({ data, params, tick, random }) => { /* ... */ },
});
```

- Draw all randomness from the injected `random` (`random()`, `random.int`,
  `random.pick`) — never `Math.random` — so runs replay from their seed.
  Sims without randomness can keep the one-arg `init: (params) => ...` form.
- If the sim consumes transient user events (paint strokes, direction
  changes, cell toggles), declare the input type as `defineSim`'s third
  generic and read `inputs` from the step context:

  ```ts
  export default defineSim<MyData, MyParams, MyInput>({
    // ...
    step: ({ data, params, inputs }) => { /* apply inputs in order */ },
  });
  ```

  The demo component translates DOM events and calls `send()` from
  `useSimulation()`. Persistent configuration stays in params. Smuggling
  events through `setParams` with sentinel values (params-as-signal) is
  **unblessed** — don't write new code that way.

### 2. Demo component (`src/demos/MyExampleDemo.tsx`)

Standard canvas-based demo structure, using the docs-site helper components
(`CanvasStage`, `DemoSplit`, `DemoControlPanel`):

```tsx
import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { DemoControlPanel, DemoControlGroup } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import mySim from '../sims/myExampleSim';
import styles from './MyExampleDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function MyCanvas() {
  const canvasRef = useSimulationCanvas<typeof mySim>(
    (ctx, { data, params }, view) => {
      view.clear(view.theme('--bg2', '#fff'));
      // ... draw in CSS pixels — the hook applies the dpr transform ...
    },
    { width: WIDTH, height: HEIGHT }
  );
  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const CONTROL_GROUPS: DemoControlGroup[] = [
  {
    label: 'Parameters',
    controls: [
      { type: 'range', param: 'speed', label: 'Speed', min: 1, max: 10, step: 1 },
      { type: 'toggle', param: 'wrap', label: 'Wrap edges' },
      // type: 'chips' for button groups with { options: [{ value, label }] }
    ],
  },
];

export function MyExampleDemo() {
  return (
    <Simulation sim={mySim} delayMs={0} autoplay>
      <DemoSplit
        preview={<MyCanvas />}
        controls={<DemoControlPanel groups={CONTROL_GROUPS} />}
      />
    </Simulation>
  );
}
```

Wrap the canvas in `<CanvasStage maxWidth={W}>` for consistent sizing and an
optional perf overlay.

Canvas rules (see the library guide for the full view-toolkit patterns —
`clear`/`fade`/`theme`/`blitGrid`, grid blits, trail effects):

- Always pass `{ width, height }` (logical CSS pixels) to
  `useSimulationCanvas` — **ownership mode**. The hook owns the canvas
  backing store and the devicePixelRatio transform; draw functions work in
  CSS pixels and receive the injected `view` toolkit as third argument.
- Do **not** set `width`/`height` attributes on the `<canvas>` element, and
  do not do DPR math (`width={W * dpr}`, manual `setTransform(dpr, …)`) —
  those legacy recipes are superseded and unblessed in new code.
- Read theme colors with `view.theme('--fg1', '#000')` inside the draw —
  never `getComputedStyle` (unblessed in draw functions; `view.theme` also
  repaints on theme switches, even while paused).
- For ImageData-style cell grids use `view.blitGrid(cols, rows, write)`
  instead of hand-rolled offscreen canvas + `ImageData` refs.

### 3. CSS module (`src/demos/MyExampleDemo.module.css`)

Minimal — typically just canvas sizing. The hook owns the backing-store
attributes; CSS owns the display size:

```css
.canvas {
  width: 100%;
  height: auto;
  display: block;
}
```

### 4. Page wrapper (`src/pages/examples/MyExamplePage.tsx`)

```tsx
import { ExamplePage } from '../../layout/ExamplePage';
import { MyExampleDemo } from '../../demos/MyExampleDemo';

export function MyExamplePage() {
  return (
    <ExamplePage
      title="My Example"
      description={
        <>
          <p>Brief explanation of the simulation and what makes it interesting.</p>
        </>
      }
    >
      <MyExampleDemo />
    </ExamplePage>
  );
}
```

### 5. Route (`src/App.tsx`)

Add the import at the top:
```tsx
import { MyExamplePage } from './pages/examples/MyExamplePage';
```

Add the route under the `<ShellRoute variant='playground'>` section, alongside the other examples:
```tsx
<Route path='examples/my-example' element={<MyExamplePage />} />
```

### 6. Sidebar / table of contents (`src/layout/Sidebar.tsx`)

Add an entry to the `EXAMPLES` array:
```tsx
{ to: '/examples/my-example', label: 'My Example' },
```

## Docs-site Helper Components

These components are specific to the docs site (`apps/automatick-docs/src/components/`).

### Control panel

Controls are defined as `DemoControlGroup[]` and passed to `<DemoControlPanel>`:

```ts
type DemoControlGroup = {
  label?: string;           // Group heading
  controls: DemoControl[];  // Array of controls
};

// Range slider
{ type: 'range', param: 'speed', label: 'Speed', min: 1, max: 10, step: 1, format?: (v) => string }

// Boolean toggle
{ type: 'toggle', param: 'wrap', label: 'Wrap edges' }

// Button group (chips)
{ type: 'chips', param: 'mode', label: 'Mode', options: [{ value: 'a', label: 'A' }, ...] }
```

The `param` field must match a key in the sim's `Params` type. Controls call
`setParams()` internally — they are for persistent configuration only. For
transient gestures (canvas clicks, key presses, brush strokes) call `send()`
from `useSimulation()` in a custom handler and consume them as `inputs` in the
sim's `step` — don't route them through params.

`DemoControlPanel` also accepts:
- `showTransport` (default `true`) — play/pause + tick readout
- `showReset` (default `true`) — reset button
- `showStep` (default `false`) — step-once button
- `extra` — additional JSX rendered after control groups (e.g., live stats)

### TimeSeries chart

For sims that track aggregate metrics over time:

```tsx
import { TimeSeries } from '../components/TimeSeries';

<TimeSeries<typeof mySim>
  series={[
    { color: '#e74c3c', label: 'Sick', accessor: (data) => data.sickCount },
    { color: '#2ecc71', label: 'Healthy', accessor: (data) => data.healthyCount },
  ]}
  mode="area"    // or "line"
  height={140}
  maxHistory={1000}
/>
```

## Naming Conventions

- Sim files: `camelCaseSim.ts` (e.g., `boidsSim.ts`, `gameOfLifeSim.ts`)
- Demo components: `PascalCaseDemo.tsx` + `PascalCaseDemo.module.css`
- Page components: `PascalCasePage.tsx`
- Export the sim as the default export from the sim file
- Export the demo component as a named export
- Export the page component as a named export
- Export `Data` and `Params` types from the sim file when needed by demo components

## Build & Test

```bash
npm install                          # install deps (monorepo)
npm run dev -w apps/automatick-docs  # dev server for docs site
npm test -w packages/automatick      # run library tests
npm run build -w packages/automatick # build the library
```

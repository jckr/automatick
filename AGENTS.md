# automatick — Agent Guide

This file covers the **automatick library** — what it is, how to define
simulations, the rendering flavors, and the public API. It applies anywhere you
build with automatick.

> **Adding an example to the documentation site?**
> See [`apps/automatick-docs/AGENTS.md`](./apps/automatick-docs/AGENTS.md) for the
> docs-site-specific workflow: the new-example checklist, demo/control
> conventions, route + sidebar wiring, and example thumbnails.

## What is this?

automatick is a library for building tick-based simulations in React. The developer provides `init` (initial state), `step` (state → next state), and a renderer. The library handles the animation loop, play/pause/stop state machine, timing, controls, and optional web worker offloading.

## Repository Layout

```
packages/automatick/         — The library (npm package)
  src/sim.ts                 — defineSim() — simulation definition
  src/engine.ts              — SimulationEngine — tick loop, state machine
  src/state.ts               — State<Data, Params> type
  src/react/                 — React bindings (Simulation, hooks, controls)
  src/worker/                — Web Worker plumbing

apps/automatick-docs/        — Documentation site (Vite + React)
  src/sims/                  — Simulation logic files (*Sim.ts)
  src/demos/                 — Demo React components (*Demo.tsx + *.module.css)
  src/pages/examples/        — Page wrappers (*Page.tsx)
  src/components/            — Shared layout components
  src/layout/                — Shell, sidebar, routing
```

## Defining a Simulation

Every sim is a single file that exports the result of `defineSim<Data, Params>()`:

```ts
import { defineSim } from 'automatick/sim';

export type MyData = { /* simulation state */ };
export type MyParams = { /* user-tweakable parameters */ };

export default defineSim<MyData, MyParams>({
  defaultParams: { /* initial param values */ },
  init: (params) => { /* return initial MyData */ },
  step: ({ data, params, tick }) => { /* return next MyData */ },
  shouldStop: (data, params) => false, // optional
});
```

### Rules for `init`

- Can be a value (`init: { count: 0 }`) or a function (`init: (params) => ...`).
- Use the function form when initial state depends on params (grid size, agent count, density, etc.).
- Called once at engine creation and again on every `resetWith()`.
- The engine `structuredClone`s value-form inits, so mutations in `step` don't leak across resets.

### Rules for `step`

- Pure and synchronous. Receives `{ data, params, tick, status, stepDurationMs }`, returns the next `Data`.
- `Data` must be structured-cloneable (no functions, no circular refs, no DOM nodes).
- Mutating `data` in place is fine as long as you return it — the engine does not clone between ticks.
- For grid/field sims: prefer typed arrays (`Float32Array`, `Int8Array`) over nested JS arrays for performance.
- For agent sims: an array of plain objects is fine.

### Rules for `shouldStop`

- Optional. Checked after each step. Return `true` to transition to `stopped` status.
- Use for sims that reach equilibrium (Game of Life with no changes, segregation above happiness threshold).
- Most sims don't need this — omit it.

## Three Rendering Flavors

### 1. Canvas (most examples)

Use when: rendering particles, grids, fields, agents — anything that benefits from direct pixel control. This is the default choice for new examples.

```tsx
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';

function MyCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const canvasRef = useSimulationCanvas<typeof mySim>((ctx, { data, params }) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // draw here using ctx
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
  return <canvas ref={canvasRef} width={WIDTH * dpr} height={HEIGHT * dpr} />;
}
```

Key patterns:
- `useSimulationCanvas` subscribes directly to the engine — drawing bypasses React's render cycle entirely.
- Always handle device pixel ratio: set canvas dimensions to `width * dpr`, then `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` at the start of draw and reset at the end.
- For pixel-level rendering (grids, fields), use an offscreen canvas + `ImageData` for best performance (see `TrafficDemo`, `GrayScottDemo`).
- For shape-based rendering (agents, particles), use `ctx.fillRect`, `ctx.arc`, etc. directly.

> In the docs site, wrap the canvas in `<CanvasStage maxWidth={W}>` for consistent
> sizing and an optional perf overlay — see the docs-site guide.

### 2. React DOM (rare)

Use when: the sim has a small number of discrete visual elements that benefit from DOM features (CSS transitions, hover states, accessibility). Examples: counter display, dice, small grids.

```tsx
function Display() {
  const { data, tick } = useSimulation<typeof mySim>();
  return <div>{/* render data as JSX */}</div>;
}
```

The `useSimulation` hook triggers React re-renders on every tick, so this only works well for sims with low tick rates or simple renders. Almost all new examples should use canvas instead.

### 3. Worker (computationally heavy sims)

Use when: `step` is expensive enough to cause frame drops on the main thread. The sim runs in a Web Worker; the main thread receives throttled snapshots.

```tsx
// Import the sim file as a worker module URL:
import simUrl from '../sims/mySim.ts?worker-module';

// In the component — note explicit type params since types can't be inferred from a URL:
<Simulation<MyData, MyParams> worker={simUrl} delayMs={0} autoplay>
  {/* children are the same as local mode */}
</Simulation>
```

Key differences from local mode:
- `sim` prop becomes `worker` prop (a URL string, not the module itself).
- Type params (`<Data, Params>`) must be explicit on `<Simulation>` since TypeScript can't infer from a URL.
- `useSimulationCanvas` type param uses `<Data, Params>` instead of `<typeof mySim>`.
- `snapshotIntervalMs` prop controls how often the worker sends state to the main thread (default 16ms).

Most examples should start as local (canvas) and only move to worker if performance requires it.

## Common `<Simulation>` Props

| Prop | Type | Default | When to use |
|------|------|---------|-------------|
| `sim` | `SimModule` | — | Main-thread mode (most examples) |
| `worker` | `string \| URL` | — | Worker mode (heavy computation) |
| `delayMs` | `number` | `0` | Slow down ticks (e.g., `100` for step-by-step visibility) |
| `autoplay` | `boolean` | `false` | Start immediately on mount |
| `maxTime` | `number` | — | Auto-stop after N ticks |
| `ticksPerFrame` | `number` | `1` | Batch multiple ticks per frame (heavy inner loops) |
| `params` | `Partial<Params>` | — | Override default params from outside |

## Rendering Patterns

### Agent-based sims (Boids, Epidemic, Ant Colony)

```ts
// Data is an array of agent objects
type Data = { agents: Agent[] };

// Draw: iterate agents, draw shapes
(ctx, { data }) => {
  ctx.clearRect(0, 0, W, H);
  for (const agent of data.agents) {
    ctx.beginPath();
    ctx.arc(agent.x, agent.y, agent.r, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

### Grid/cellular automata (Game of Life, Traffic, Segregation)

```ts
// Data uses flat arrays for performance
type Data = { cells: Int8Array; width: number; height: number };

// Draw: use ImageData for pixel-level control
(ctx, { data }) => {
  const imageData = ctx.createImageData(data.width, data.height);
  for (let i = 0; i < data.cells.length; i++) {
    const j = i * 4;
    imageData.data[j] = data.cells[i] ? 255 : 0;     // R
    imageData.data[j + 1] = 0;                         // G
    imageData.data[j + 2] = 0;                         // B
    imageData.data[j + 3] = 255;                       // A
  }
  ctx.putImageData(imageData, 0, 0);
}
```

For grids larger than the canvas, use an offscreen canvas:
```ts
const offscreen = document.createElement('canvas');
offscreen.width = gridWidth;
offscreen.height = gridHeight;
const offCtx = offscreen.getContext('2d')!;
offCtx.putImageData(imageData, 0, 0);
ctx.imageSmoothingEnabled = false;
ctx.drawImage(offscreen, 0, 0, canvasWidth, canvasHeight);
```

Store offscreen canvas and ImageData in refs to avoid re-creating each frame (see `TrafficDemo`, `GrayScottDemo`).

### Trail effects (Gravity, particle systems)

```ts
// Instead of clearing, overlay a semi-transparent rect
ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
ctx.fillRect(0, 0, W, H);
// Then draw current frame on top
```

### Theme-aware colors

Read CSS custom properties for colors that adapt to light/dark mode:
```ts
const styles = getComputedStyle(document.documentElement);
const fg = styles.getPropertyValue('--fg1').trim();
const bg = styles.getPropertyValue('--bg2').trim();
```

## Build & Test

```bash
npm install                          # install deps (monorepo)
npm run dev -w apps/automatick-docs  # dev server for docs site
npm test -w packages/automatick      # run library tests
npm run build -w packages/automatick # build the library
```

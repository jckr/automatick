# Building with automatick

automatick is a library for building tick-based simulations in React. You
provide `init` (initial state), `step` (state → next state), and a renderer; the
library handles the animation loop, play/pause/stop state machine, timing,
controls, and optional web worker offloading.

This guide is self-contained: it covers everything you need to build a
simulation with automatick, independent of any particular app.

## Package Layout

```
src/sim.ts        — defineSim() — simulation definition
src/engine.ts     — SimulationEngine — tick loop, state machine
src/state.ts      — State<Data, Params> type
src/react/        — React bindings (Simulation, hooks, canvas)
src/worker/       — Web Worker plumbing
```

Public import paths:

```ts
import { defineSim } from 'automatick/sim';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
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

### 1. Canvas (most common)

Use when: rendering particles, grids, fields, agents — anything that benefits from direct pixel control. This is the default choice.

```tsx
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';

function MyCanvas() {
  const canvasRef = useSimulationCanvas<typeof mySim>(
    (ctx, { data, params }, view) => {
      view.clear(view.theme('--bg2', '#fff'));
      // draw here using ctx, in CSS pixels
    },
    { width: WIDTH, height: HEIGHT }
  );
  return <canvas ref={canvasRef} style={{ width: WIDTH, height: HEIGHT }} />;
}
```

Key patterns:
- `useSimulationCanvas` subscribes directly to the engine — drawing bypasses React's render cycle entirely.
- Pass `{ width, height }` (logical CSS pixels) to enter **ownership mode**: the hook sizes the canvas backing store (`width × dpr`), applies the devicePixelRatio transform around every draw, and tracks dpr changes. You draw in CSS pixels and never touch `dpr`. Don't set `width`/`height` attributes on the element — do set its CSS size.
- The draw function receives a third argument, the injected `view` toolkit (`clear`, `fade`, `theme`, `blitGrid`) — see "Canvas Rendering Patterns" below.
- View helpers depend only on the drawing context and values — never do direct DOM reads (`getComputedStyle`, `window.devicePixelRatio`) inside a draw function; use `view.theme()` / `view.dpr` instead.

### 2. React DOM (rare)

Use when: the sim has a small number of discrete visual elements that benefit from DOM features (CSS transitions, hover states, accessibility). Examples: counter display, dice, small grids.

```tsx
function Display() {
  const { data, tick } = useSimulation<typeof mySim>();
  return <div>{/* render data as JSX */}</div>;
}
```

The `useSimulation` hook triggers React re-renders on every tick, so this only works well for sims with low tick rates or simple renders. Most sims should use canvas instead.

### 3. Worker (computationally heavy sims)

Use when: `step` is expensive enough to cause frame drops on the main thread. The sim runs in a Web Worker; the main thread receives throttled snapshots.

```tsx
// Import the sim file as a worker module URL:
import simUrl from './mySim.ts?worker-module';

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

Most sims should start as local (canvas) and only move to worker if performance requires it.

## Common `<Simulation>` Props

| Prop | Type | Default | When to use |
|------|------|---------|-------------|
| `sim` | `SimModule` | — | Main-thread mode (most sims) |
| `worker` | `string \| URL` | — | Worker mode (heavy computation) |
| `delayMs` | `number` | `0` | Slow down ticks (e.g., `100` for step-by-step visibility) |
| `autoplay` | `boolean` | `false` | Start immediately on mount |
| `maxTime` | `number` | — | Auto-stop after N ticks |
| `ticksPerFrame` | `number` | `1` | Batch multiple ticks per frame (heavy inner loops) |
| `params` | `Partial<Params>` | — | Override default params from outside |

## Canvas Rendering Patterns

The draw function signature is `(ctx, snapshot, view) => void`. The third
argument is the injected **view toolkit** (`CanvasView` from
`automatick/canvas`) — helpers are injected, never imported. Use it with
ownership mode: `useSimulationCanvas(draw, { width, height })` in React, or
`attachCanvas(engine, canvas, draw, { width, height })` framework-free.
Existing two-argument draws `(ctx, snapshot)` keep working (legacy mode, no
options — see below).

### The view toolkit

```ts
view.width   // logical (CSS px) drawing width
view.height  // logical (CSS px) drawing height
view.dpr     // current devicePixelRatio (already applied to the transform)

view.clear();                          // clearRect over the full logical area
view.clear(view.theme('--bg2'));       // fill with a (theme) color instead
view.fade(0.05);                       // trail effect: translucent black fill
view.fade(0.05, '#fff');               // trail effect over a light background
view.theme('--fg1', '#000');           // CSS custom property, cached per frame
view.blitGrid(cols, rows, (px) => {…}); // pixel grid → scaled, crisp blit
```

All helpers restore any context state they touch (`fillStyle`, `globalAlpha`,
`imageSmoothingEnabled`) — they never leak into your subsequent drawing.

### Agent-based sims (boids, epidemic, ant colony)

```ts
// Data is an array of agent objects
type Data = { agents: Agent[] };

// Draw: iterate agents, draw shapes (in CSS pixels — dpr is handled)
(ctx, { data }, view) => {
  view.clear(view.theme('--bg2', '#fff'));
  for (const agent of data.agents) {
    ctx.beginPath();
    ctx.arc(agent.x, agent.y, agent.r, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

There are deliberately no shape helpers (`circle()`, etc.) on the view — the
2D context is the drawing vocabulary.

### Grid/cellular automata (Game of Life, traffic, segregation)

```ts
// Data uses flat arrays for performance
type Data = { cells: Int8Array; width: number; height: number };

// Draw: blitGrid hands you a cols×rows RGBA buffer and scales it to the
// canvas with smoothing off. The offscreen canvas + ImageData are cached
// per attachment and only recreated when dimensions change.
(ctx, { data }, view) => {
  view.blitGrid(data.width, data.height, (px) => {
    for (let i = 0; i < data.cells.length; i++) {
      const j = i * 4;
      px[j] = data.cells[i] ? 255 : 0; // R
      px[j + 1] = 0;                   // G
      px[j + 2] = 0;                   // B
      px[j + 3] = 255;                 // A
    }
  });
}
```

### Trail effects (gravity, particle systems)

```ts
// Instead of clearing, overlay a semi-transparent rect, then draw on top
(ctx, { data }, view) => {
  view.fade(0.05);
  // draw current frame
}
```

### Theme-aware colors

`view.theme(varName, fallback?)` reads a CSS custom property from
`document.documentElement`, trimmed and cached per frame:

```ts
(ctx, { data }, view) => {
  const fg = view.theme('--fg1', '#000');
  const bg = view.theme('--bg2', '#fff');
  view.clear(bg);
  ctx.fillStyle = fg;
  // …
}
```

On first use, `theme()` lazily wires theme-change observers (class /
`data-theme` / `style` mutations on `<html>` plus `prefers-color-scheme`);
when the theme flips, the last snapshot is redrawn immediately — even while
the sim is paused — so the canvas never goes stale on a light/dark switch.
Never call `getComputedStyle` directly inside a draw function.

### Legacy recipes (superseded, still working)

Pre-toolkit call sites pass a two-argument draw and no options. They keep
compiling and behaving identically: the hook never resizes their canvas and
applies no transform. The old manual recipes — `width={W * dpr}` attributes
with a hand-rolled `ctx.setTransform(dpr, …)`, manually cached offscreen
canvas + `ImageData` refs, raw `getComputedStyle` theme reads, and manual
`fillRect` trail overlays — are superseded by ownership mode and the view
toolkit. Don't use them in new code.

Note: the docs-site demos have NOT yet been migrated to the view toolkit
(separate follow-up); they still use the legacy patterns.

## Build & Test

```bash
npm test   # run library tests
npm run build  # build the library
```

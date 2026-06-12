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
- It does not receive `random` — termination must be a deterministic function of state.

### Rules for randomness

- Use `random` from the step context instead of `Math.random`, so runs are
  reproducible from their seed:

  ```ts
  init: (params, { random }) => ({ x: random() * params.width }),
  step: ({ data, params, random }) => {
    const dx = random() - 0.5;            // uniform [0, 1), like Math.random
    const lane = random.int(0, 3);        // integer, BOTH bounds inclusive
    const dir = random.pick(['N', 'E', 'S', 'W'] as const);
    // ...
  },
  ```

- `init` receives the same toolkit as an optional second argument — use it
  for randomized initial state (random grids, agent positions, …).
- Seed a run from the component: `<Simulation sim={mySim} seed={42}>` (numbers
  or strings; captured at mount). When omitted, a random seed is generated and
  recorded — read it back as `seed` from `useSimulation()` to display or copy.
- Same seed ⇒ same run, and `resetWith()` replays the run from the same seed.
- Avoid other ambient nondeterminism in `init`/`step`: no `Date.now()`,
  `performance.now()`, or environment-dependent reads.

### Rules for inputs

- **Params vs inputs:** params are persistent configuration the sim consults
  every tick (`setParams`); inputs are transient, consumed-once perturbation
  events delivered to exactly one tick (`send`). Brush *size* is a param;
  brush *strokes* are inputs. Direction changes, cell toggles, paint strokes —
  if it happens once and perturbs the run, it's an input.
- Declare the input type as `defineSim`'s third generic and read `inputs`
  from the step context:

  ```ts
  type Stroke = { x: number; y: number };

  export default defineSim<PaintData, PaintParams, Stroke>({
    defaultParams: { brushSize: 2 },        // persistent config: a param
    init: (params) => ({ grid: makeGrid(params) }),
    step: ({ data, params, inputs }) => {
      for (const stroke of inputs) {        // consumed-once events: inputs
        paint(data.grid, stroke, params.brushSize);
      }
      return diffuse(data);
    },
  });
  ```

  In the component, translate browser events yourself and call the `send`
  action from `useSimulation()` — the library has no DOM awareness:

  ```tsx
  const { send } = useSimulation<typeof paintSim>();
  // e.g. in a canvas onPointerMove handler:
  send({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  ```

- Delivery is tick-based: everything sent since the last tick advance arrives
  in the next tick's `inputs`, in send order; ticks with nothing queued see an
  empty array. Inputs are never coalesced — every `send` reaches the sim —
  but there are no latency guarantees (an input lands on the next tick,
  whenever that is). Sent while `paused`/`idle` they queue; while `stopped`
  they're dropped; `resetWith()` clears the queue. The queue is bounded
  (`maxQueuedInputs` prop, default 1024, drop-oldest).
- `Input` values must be structured-cloneable, same as `Data` — in worker
  mode each one crosses `postMessage`.
- The old params-as-signal pattern — smuggling events through `setParams`
  with sentinel values like `paintX: -1` for "no stroke" — is **unblessed**:
  don't use it in new code. Existing docs-site demos that do are slated for
  migration to `send`/`inputs` (#79).

## Three Rendering Flavors

### 1. Canvas (most common)

Use when: rendering particles, grids, fields, agents — anything that benefits from direct pixel control. This is the default choice.

```tsx
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';

function MyCanvas() {
  const canvasRef = useSimulationCanvas<typeof mySim>(
    (ctx, { data, params }, view) => {
      view.clear('--bg2');
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
view.clear('--bg2');                   // fill with a CSS color or theme custom property
view.fade(0.05);                       // trail effect: translucent black fill
view.fade(0.05, '#fff');               // trail effect over a light background
view.theme('--fg1', '#000');           // CSS custom property, cached per frame
view.blitGrid(cols, rows, (px) => {…}); // pixel grid → scaled, crisp blit
```

All helpers restore any context state they touch (`fillStyle`, `globalAlpha`,
`imageSmoothingEnabled`) — they never leak into your subsequent drawing.

`clear`/`fade` color arguments accept either a CSS color (used as-is) or a
theme custom property name (resolved via `view.theme`, so theme switches
repaint). An unresolvable value logs an error once and paints nothing — no
throw, mirroring how canvas contexts ignore invalid color assignments.

### Agent-based sims (boids, epidemic, ant colony)

```ts
// Data is an array of agent objects
type Data = { agents: Agent[] };

// Draw: iterate agents, draw shapes (in CSS pixels — dpr is handled)
(ctx, { data }, view) => {
  view.clear('--bg2');
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

## Build & Test

```bash
npm test   # run library tests
npm run build  # build the library
```

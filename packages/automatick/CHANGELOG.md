# Changelog

## 0.0.4 — 2026-07-28

- Seeded RNG injected into `init` and `step`: draw randomness from the supplied `random` (`random()`, `random.int`, `random.pick`) instead of `Math.random` so runs replay deterministically from their seed. Exposed as a new `automatick/random` entry point. (#80)
- Canvas view toolkit and ownership mode for `useSimulationCanvas`: the hook owns the backing store and devicePixelRatio transform, draw functions work in CSS pixels and receive a `view` toolkit (`clear`/`fade`/`theme`/`blitGrid`) as a third argument. Exposed as a new `automatick/canvas` entry point. (#81)
- Explicit per-tick input channel: transient perturbations flow through `send()` from `useSimulation()` and are read as `inputs` in `step`, replacing the params-as-signal pattern. Declare the input type as `defineSim`'s third generic. (#82)
- `AGENTS.md` now ships in the published tarball so the library guide travels with the package.

The library still has no known consumers, so these additive changes stay a patch bump rather than getting promoted to 0.1.0.

## 0.0.3 — 2026-05-27

- `<Simulation>` accepts a sim's parts (`init`, `step`, …) directly as props in addition to a bundled sim object. (#63)
- `<Simulation worker={...}>` spawns a real `Worker`; the `engineUrl` prop was dropped in favor of the worker handling engine setup itself.
- Children are held back until the first real snapshot is available, so consumers never render against a placeholder state.

## 0.0.2 — 2026-05-08

- `init` accepts a value as well as an initializer function; values are `structuredClone`d on each (re)init so the source object is never mutated. (#7)
- `createEngine` accepts an optional `render` callback — sugar for `engine.subscribe(render)` plus an initial paint. (#9)
- `createEngine` drives an internal `requestAnimationFrame` loop by default (`autoFrame: true`). The React adapter and worker host pass `autoFrame: false` because they own the frame loop or run where rAF doesn't exist. Vanilla consumers must call `destroy()` to release the loop. (#12)
- `step`, `getSnapshot`, the `render` sugar, listeners, and the worker wire now share a single `State<Data, Params>` type. `StepArgs` and `EngineSnapshot` are removed; `step` also receives `status` and the previous tick's `stepDurationMs`. (#15)
- README documents `import * as Automatick from 'automatick'` for namespace-style usage instead of a synthesized default export. (#16)

## 0.0.1 — 2026-04-27

Initial publish.

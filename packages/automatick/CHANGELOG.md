# Changelog

## 0.0.2 — 2026-05-08

- `init` accepts a value as well as an initializer function; values are `structuredClone`d on each (re)init so the source object is never mutated. (#7)
- `createEngine` accepts an optional `render` callback — sugar for `engine.subscribe(render)` plus an initial paint. (#9)
- `createEngine` drives an internal `requestAnimationFrame` loop by default (`autoFrame: true`). The React adapter and worker host pass `autoFrame: false` because they own the frame loop or run where rAF doesn't exist. Vanilla consumers must call `destroy()` to release the loop. (#12)
- `step`, `getSnapshot`, the `render` sugar, listeners, and the worker wire now share a single `State<Data, Params>` type. `StepArgs` and `EngineSnapshot` are removed; `step` also receives `status` and the previous tick's `stepDurationMs`. (#15)
- README documents `import * as Automatick from 'automatick'` for namespace-style usage instead of a synthesized default export. (#16)

## 0.0.1 — 2026-04-27

Initial publish.

import React from 'react';
import type { SimInit, SimModule, StepContext } from '../sim';
import { createEngine } from '../engine';
import type { SimulationEngine, TickPerformance } from '../engine';
import type { State } from '../state';
import { createSimWorker } from '../worker/createSimWorker';
import { createWorkerRunner } from '../worker/workerRunner';
import type { WorkerRunner } from '../worker/workerRunner';
import { SimulationContext } from './SimulationContext';
import type { SimulationContextValue } from './SimulationContext';
import { EngineContext } from './EngineContext';
import type { EngineContextValue } from './EngineContext';
import { useStableCallback } from './stableCallback';
import { createVisibilityGate } from './visibilityGate';

/** Common simulation-level props shared by all three modes. */
type SimulationPropsCommon<Params> = {
  params?: Partial<Params>;
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  /**
   * Bound on the engine's input queue (default 1024, drop-oldest) — see
   * `EngineConfig.maxQueuedInputs`. Captured at mount.
   */
  maxQueuedInputs?: number;
  autoplay?: boolean;
  /**
   * Opt-in viewport visibility gating (off by default). When set, the adapter
   * freezes its animation-frame clock while the simulation is scrolled out of
   * view and resumes it on re-entry — without touching engine status, so a
   * user-paused sim stays paused and nothing was-playing needs remembering.
   * With `autoplay`, the first `play()` is also held until the content is first
   * visible, so demos mounted below the fold don't start until seen.
   *
   * Requires a `useSimulationCanvas` canvas to observe (the element whose
   * visibility drives the gate). Main-thread mode only for now — worker mode
   * ignores it (the worker drives its own timer loop; suspend/resume over the
   * protocol is phase 2). No-op where `IntersectionObserver` is unavailable.
   */
  pauseWhenHidden?: boolean;
  /**
   * Seed for the simulation's `SimRandom`. When omitted, a random numeric
   * seed is generated and recorded — read it back as `seed` from
   * `useSimulation()`. Captured at mount (like `sim`): changing it
   * mid-session is not live-applied. Change the component's `key` to remount
   * with a new seed.
   */
  seed?: number | string;
  children?: React.ReactNode;
};

type SimulationPropsLocal<Data, Params, Input> = SimulationPropsCommon<Params> & {
  sim: SimModule<Data, Params, Input>;
  worker?: never;
  init?: never;
  step?: never;
  shouldStop?: never;
  defaultParams?: never;
};

// `_Data`/`_Input` are unused in this variant — a worker-mode call site
// specifies them via the `<Simulation<Data, Params, Input>>` generic args,
// since they can't be inferred from a URL.
type SimulationPropsWorker<_Data, Params, _Input> = SimulationPropsCommon<Params> & {
  sim?: never;
  /**
   * URL of the sim module the worker should `import()` inside its own context.
   * Vite idiom: `new URL('./sim.ts', import.meta.url)`. Plain strings are
   * resolved the same way.
   *
   * Data/Params/Input can't be inferred from a URL, so worker-mode call sites
   * specify them via the `<Simulation<Data, Params, Input>>` generic
   * parameters.
   */
  worker: URL | string;
  init?: never;
  step?: never;
  shouldStop?: never;
  defaultParams?: never;
  snapshotIntervalMs?: number;
};

type SimulationPropsInline<Data, Params, Input> = SimulationPropsCommon<Params> & {
  sim?: never;
  worker?: never;
  init: SimInit<Data, Params, Input>;
  step: (ctx: StepContext<Data, Params, Input>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  defaultParams?: Params;
};

export type SimulationProps<
  Data,
  Params = Record<string, never>,
  Input = never,
> =
  | SimulationPropsLocal<Data, Params, Input>
  | SimulationPropsWorker<Data, Params, Input>
  | SimulationPropsInline<Data, Params, Input>;

/**
 * Common interface for both engine (main-thread) and worker-backed runner.
 */
type Backend<Data, Params, Input = never> = {
  getSnapshot: () => State<Data, Params>;
  getSeed: () => number | string;
  subscribe: (
    listener: (snapshot: State<Data, Params>) => void
  ) => () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (tick: number) => void;
  advance: (count?: number) => void;
  setParams: (patch: Partial<Params>) => void;
  resetWith: (patch?: Partial<Params>) => void;
  /** Queue a transient perturbation event — see `SimulationEngine.send`. */
  send: (input: Input) => void;
  destroy: () => void;
  handleAnimationFrame?: (nowMs: number) => void;
  recordDrawTime: (tick: number, ms: number) => void;
  getPerformance: () => readonly TickPerformance[];
};

// ---------------------------------------------------------------------------
// Local (main-thread) Simulation
// ---------------------------------------------------------------------------

/**
 * Internal props for LocalSimulation — the *parts* of a sim module plus
 * simulation-level props. The public `Simulation` dispatcher normalizes both
 * `sim={module}` and inline-prop call sites into this shape.
 */
type LocalSimulationProps<Data, Params, Input> = SimulationPropsCommon<Params> & {
  init: SimInit<Data, Params, Input>;
  step: (ctx: StepContext<Data, Params, Input>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  defaultParams?: Params;
};

function LocalSimulation<Data, Params, Input>(
  props: LocalSimulationProps<Data, Params, Input>
) {
  const {
    init,
    step,
    shouldStop,
    defaultParams,
    params: paramsProp,
    children,
    autoplay,
    pauseWhenHidden,
  } = props;

  const engineRef = React.useRef<SimulationEngine<Data, Params, Input> | null>(
    null
  );

  // Visibility gate for pauseWhenHidden — created once, only when opted in.
  // `pauseWhenHidden` is captured at mount like `seed`/`sim`; toggling it later
  // is not live-applied.
  const gateRef = React.useRef<ReturnType<typeof createVisibilityGate> | null>(
    null
  );
  if (pauseWhenHidden && !gateRef.current) {
    gateRef.current = createVisibilityGate();
  }
  const gate = gateRef.current;

  if (!engineRef.current) {
    // Merge precedence: defaultParams (if any) < params prop. When neither
    // is supplied, leave initialParams undefined and let the engine seed {}.
    let initialParams: Params | undefined;
    if (defaultParams && paramsProp) {
      initialParams = { ...defaultParams, ...paramsProp };
    } else if (defaultParams) {
      initialParams = defaultParams;
    } else if (paramsProp) {
      // Without defaults, the params prop is the full param object.
      initialParams = paramsProp as Params;
    }

    engineRef.current = createEngine<Data, Params, Input>({
      init,
      step,
      shouldStop,
      initialParams,
      // Captured at mount — later changes to the seed prop are not applied.
      seed: props.seed,
      maxTime: props.maxTime,
      delayMs: props.delayMs,
      ticksPerFrame: props.ticksPerFrame,
      maxQueuedInputs: props.maxQueuedInputs,
      // The React adapter drives its own rAF loop tied to component lifecycle.
      autoFrame: false,
    });
  }
  const engine = engineRef.current;

  const [snapshot, setSnapshot] = React.useState(() => engine.getSnapshot());

  React.useEffect(() => engine.subscribe((next) => setSnapshot(next)), [engine]);

  React.useEffect(() => {
    if (!autoplay) return;
    const g = gateRef.current;
    // Deferred autoplay: hold the first play() until the content is first
    // visible. whenFirstVisible fires synchronously when already visible (or
    // when the gate degraded to always-visible), so the no-gate path is just
    // an immediate play().
    if (g) g.whenFirstVisible(() => engine.play());
    else engine.play();
  }, [engine, autoplay]);

  // Tear down the gate's observer on unmount.
  React.useEffect(() => () => gateRef.current?.destroy(), []);

  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (paramsProp) engine.setParams(paramsProp);
  }, [engine, paramsProp]);

  // Live-update timing props without remounting
  React.useEffect(() => {
    if (props.delayMs !== undefined) engine.setDelayMs(props.delayMs);
  }, [engine, props.delayMs]);

  React.useEffect(() => {
    if (props.ticksPerFrame !== undefined) engine.setTicksPerFrame(props.ticksPerFrame);
  }, [engine, props.ticksPerFrame]);

  React.useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function'
    )
      return;

    let rafId = 0;
    const loop = (now: number) => {
      // pauseWhenHidden: skip the engine tick while no observed element is on
      // screen. Status stays whatever it was (typically `playing`) — we just
      // don't advance the clock, so re-entry resumes seamlessly. Without a gate
      // (feature off) this is always true.
      const g = gateRef.current;
      if (!g || g.isVisible()) engine.handleAnimationFrame(now);
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [engine]);

  return (
    <SimulationProvider
      snapshot={snapshot}
      backend={engine}
      registerVisibilityTarget={gate ? gate.observe : undefined}
    >
      {children}
    </SimulationProvider>
  );
}

// ---------------------------------------------------------------------------
// Worker-backed Simulation
// ---------------------------------------------------------------------------

/**
 * Resolve the URL of the standalone engine module shipped alongside this file.
 * The standalone build at `dist/standalone/engine.js` bundles all dependencies
 * so it can be `import()`ed from a worker context (where relative chunk
 * imports would fail).
 */
function engineUrl(): string {
  return new URL('../standalone/engine.js', import.meta.url).href;
}

function WorkerSimulation<Data, Params, Input>(
  props: SimulationPropsWorker<Data, Params, Input>
) {
  const { children, autoplay } = props;
  const [runner, setRunner] = React.useState<WorkerRunner<
    Data,
    Params,
    Input
  > | null>(null);
  const [snapshot, setSnapshot] = React.useState<State<Data, Params> | null>(
    null
  );

  // Mount-only: spawn the worker, build the runner, and subscribe immediately
  // so the first snapshot (emitted by the worker after init) is never missed.
  // Subsequent updates flow through dedicated effects (params, timing) rather
  // than recreating the worker — that would lose tick state.
  React.useEffect(() => {
    const moduleUrl = props.worker.toString();
    const initialParams = (props.params ?? {}) as Params;
    // Resolve the seed on the main thread (captured at mount, like the
    // module URL) so this side always knows it — it goes out in the init
    // message and is exposed on the context for display/copy. The SimRandom
    // it derives lives worker-side.
    const seed = props.seed ?? Math.floor(Math.random() * 0x100000000);

    const worker = createSimWorker<Params>({
      moduleUrl,
      engineUrl: engineUrl(),
      initialParams,
      seed,
      config: {
        maxTime: props.maxTime,
        delayMs: props.delayMs,
        ticksPerFrame: props.ticksPerFrame,
        snapshotIntervalMs: props.snapshotIntervalMs,
        // Rides in the init/config message; the queue itself lives worker-side.
        maxQueuedInputs: props.maxQueuedInputs,
      },
    });

    const r = createWorkerRunner<Data, Params, Input>(worker, {
      initialParams,
      seed,
      config: {
        maxTime: props.maxTime,
        delayMs: props.delayMs,
        ticksPerFrame: props.ticksPerFrame,
        snapshotIntervalMs: props.snapshotIntervalMs,
        maxQueuedInputs: props.maxQueuedInputs,
      },
    });

    const unsub = r.subscribe((next) => setSnapshot(next));
    setRunner(r);

    return () => {
      unsub();
      r.destroy();
    };
    // Deliberately mount-only: rebuilding the worker on prop changes would
    // reset the simulation. Timing/param changes flow through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (autoplay && runner) runner.play();
  }, [runner, autoplay]);

  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (props.params && runner) runner.setParams(props.params);
  }, [runner, props.params]);

  // Live-apply timing config — mirrors LocalSimulation's behavior.
  React.useEffect(() => {
    if (!runner) return;
    if (
      props.delayMs === undefined &&
      props.ticksPerFrame === undefined &&
      props.snapshotIntervalMs === undefined
    )
      return;
    runner.setConfig({
      delayMs: props.delayMs,
      ticksPerFrame: props.ticksPerFrame,
      snapshotIntervalMs: props.snapshotIntervalMs,
    });
  }, [runner, props.delayMs, props.ticksPerFrame, props.snapshotIntervalMs]);

  if (!snapshot || !runner || snapshot.data === undefined) return null;

  return (
    <SimulationProvider snapshot={snapshot} backend={runner}>
      {children}
    </SimulationProvider>
  );
}

// ---------------------------------------------------------------------------
// Shared context provider
// ---------------------------------------------------------------------------

function SimulationProvider<Data, Params, Input>({
  snapshot,
  backend,
  children,
  registerVisibilityTarget,
}: {
  snapshot: State<Data, Params>;
  backend: Backend<Data, Params, Input>;
  children?: React.ReactNode;
  /** Forwarded onto EngineContext when pauseWhenHidden is active. */
  registerVisibilityTarget?: (el: Element) => () => void;
}) {
  const play = useStableCallback(() => backend.play());
  const pause = useStableCallback(() => backend.pause());
  const stop = useStableCallback(() => backend.stop());
  const seek = useStableCallback((t: number) => backend.seek(t));
  const advance = useStableCallback((count?: number) => backend.advance(count));
  const setParams = useStableCallback((patch: Partial<Params>) =>
    backend.setParams(patch)
  );
  const resetWith = useStableCallback((patch?: Partial<Params>) =>
    backend.resetWith(patch)
  );
  const send = useStableCallback((input: Input) => backend.send(input));

  const value = React.useMemo(
    (): SimulationContextValue<Data, Params, Input> => ({
      data: snapshot.data,
      params: snapshot.params,
      tick: snapshot.tick,
      status: snapshot.status,
      seed: backend.getSeed(),
      play,
      pause,
      stop,
      seek,
      advance,
      setParams,
      resetWith,
      send,
    }),
    [
      snapshot,
      backend,
      play,
      pause,
      stop,
      seek,
      advance,
      setParams,
      resetWith,
      send,
    ]
  );

  // Engine context for direct subscription (used by useSimulationCanvas)
  const engineValue = React.useMemo(
    (): EngineContextValue => ({
      // TODO(#14): casts here bridge EngineContext's non-generic shape to
      // the typed Backend<Data, Params>. Make EngineContext generic to drop them.
      subscribe: (listener) =>
        backend.subscribe(
          listener as (snapshot: State<Data, Params>) => void
        ),
      getSnapshot: () => backend.getSnapshot() as State<unknown, unknown>,
      recordDrawTime: (tick, ms) => backend.recordDrawTime(tick, ms),
      getPerformance: () => backend.getPerformance(),
      registerVisibilityTarget,
    }),
    [backend, registerVisibilityTarget]
  );

  return (
    <EngineContext.Provider value={engineValue}>
      <SimulationContext.Provider
        value={value as SimulationContextValue<unknown, unknown>}
      >
        {children}
      </SimulationContext.Provider>
    </EngineContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Public component — dispatches to local or worker implementation
// ---------------------------------------------------------------------------

export function Simulation<Data, Params = Record<string, never>, Input = never>(
  props: SimulationProps<Data, Params, Input>
) {
  if ('worker' in props && props.worker != null) {
    return (
      <WorkerSimulation
        {...(props as SimulationPropsWorker<Data, Params, Input>)}
      />
    );
  }
  // Normalize sim={module} and inline forms into the same parts-shaped props.
  if ('sim' in props && props.sim != null) {
    const { sim, ...rest } = props as SimulationPropsLocal<Data, Params, Input>;
    return (
      <LocalSimulation
        {...rest}
        init={sim.init}
        step={sim.step}
        shouldStop={sim.shouldStop}
        defaultParams={sim.defaultParams}
      />
    );
  }
  return (
    <LocalSimulation
      {...(props as SimulationPropsInline<Data, Params, Input>)}
    />
  );
}

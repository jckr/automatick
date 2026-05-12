import React from 'react';
import type { SimInit, SimModule } from '../sim';
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

/** Common simulation-level props shared by all three modes. */
type SimulationPropsCommon<Params> = {
  params?: Partial<Params>;
  maxTime?: number;
  delayMs?: number;
  ticksPerFrame?: number;
  autoplay?: boolean;
  children?: React.ReactNode;
};

type SimulationPropsLocal<Data, Params> = SimulationPropsCommon<Params> & {
  sim: SimModule<Data, Params>;
  worker?: never;
  init?: never;
  step?: never;
  shouldStop?: never;
  defaultParams?: never;
};

// `_Data` is unused in this variant — a worker-mode call site specifies Data
// via the `<Simulation<Data, Params>>` generic args, since it can't be
// inferred from a URL.
type SimulationPropsWorker<_Data, Params> = SimulationPropsCommon<Params> & {
  sim?: never;
  /**
   * URL of the sim module the worker should `import()` inside its own context.
   * Vite idiom: `new URL('./sim.ts', import.meta.url)`. Plain strings are
   * resolved the same way.
   *
   * Data/Params can't be inferred from a URL, so worker-mode call sites
   * specify them via the `<Simulation<Data, Params>>` generic parameters.
   */
  worker: URL | string;
  init?: never;
  step?: never;
  shouldStop?: never;
  defaultParams?: never;
  snapshotIntervalMs?: number;
};

type SimulationPropsInline<Data, Params> = SimulationPropsCommon<Params> & {
  sim?: never;
  worker?: never;
  init: SimInit<Data, Params>;
  step: (state: State<Data, Params>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  defaultParams?: Params;
};

export type SimulationProps<Data, Params = Record<string, never>> =
  | SimulationPropsLocal<Data, Params>
  | SimulationPropsWorker<Data, Params>
  | SimulationPropsInline<Data, Params>;

/**
 * Common interface for both engine (main-thread) and worker-backed runner.
 */
type Backend<Data, Params> = {
  getSnapshot: () => State<Data, Params>;
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
type LocalSimulationProps<Data, Params> = SimulationPropsCommon<Params> & {
  init: SimInit<Data, Params>;
  step: (state: State<Data, Params>) => Data;
  shouldStop?: (data: Data, params: Params) => boolean;
  defaultParams?: Params;
};

function LocalSimulation<Data, Params>(props: LocalSimulationProps<Data, Params>) {
  const {
    init,
    step,
    shouldStop,
    defaultParams,
    params: paramsProp,
    children,
    autoplay,
  } = props;

  const engineRef = React.useRef<SimulationEngine<Data, Params> | null>(null);

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

    engineRef.current = createEngine<Data, Params>({
      init,
      step,
      shouldStop,
      initialParams,
      maxTime: props.maxTime,
      delayMs: props.delayMs,
      ticksPerFrame: props.ticksPerFrame,
      // The React adapter drives its own rAF loop tied to component lifecycle.
      autoFrame: false,
    });
  }
  const engine = engineRef.current;

  const [snapshot, setSnapshot] = React.useState(() => engine.getSnapshot());

  React.useEffect(() => engine.subscribe((next) => setSnapshot(next)), [engine]);

  React.useEffect(() => {
    if (autoplay) engine.play();
  }, [engine, autoplay]);

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
      engine.handleAnimationFrame(now);
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [engine]);

  return (
    <SimulationProvider snapshot={snapshot} backend={engine}>
      {children}
    </SimulationProvider>
  );
}

// ---------------------------------------------------------------------------
// Worker-backed Simulation
// ---------------------------------------------------------------------------

/**
 * Resolve the URL of the automatick engine module shipped alongside this file.
 * After build, this file lives at `dist/react/Simulation.js` and the engine is
 * the sibling-of-parent `dist/engine.js`.
 */
function engineUrl(): string {
  return new URL('../engine.js', import.meta.url).href;
}

function WorkerSimulation<Data, Params>(
  props: SimulationPropsWorker<Data, Params>
) {
  const { children, autoplay } = props;
  const [runner, setRunner] = React.useState<WorkerRunner<Data, Params> | null>(
    null
  );
  const [snapshot, setSnapshot] = React.useState<State<Data, Params> | null>(
    null
  );

  // Mount-only: spawn the worker, build the runner. Subsequent updates flow
  // through dedicated effects (params, timing) rather than recreating the
  // worker — that would lose tick state.
  React.useEffect(() => {
    const moduleUrl = props.worker.toString();
    const initialParams = (props.params ?? {}) as Params;

    const worker = createSimWorker<Params>({
      moduleUrl,
      engineUrl: engineUrl(),
      initialParams,
      config: {
        maxTime: props.maxTime,
        delayMs: props.delayMs,
        ticksPerFrame: props.ticksPerFrame,
        snapshotIntervalMs: props.snapshotIntervalMs,
      },
    });

    const r = createWorkerRunner<Data, Params>(worker, {
      initialParams,
      config: {
        maxTime: props.maxTime,
        delayMs: props.delayMs,
        ticksPerFrame: props.ticksPerFrame,
        snapshotIntervalMs: props.snapshotIntervalMs,
      },
    });

    setRunner(r);
    setSnapshot(r.getSnapshot());

    return () => {
      r.destroy();
    };
    // Deliberately mount-only: rebuilding the worker on prop changes would
    // reset the simulation. Timing/param changes flow through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!runner) return;
    return runner.subscribe((next) => setSnapshot(next));
  }, [runner]);

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

  if (!snapshot || !runner) return null;

  return (
    <SimulationProvider snapshot={snapshot} backend={runner}>
      {children}
    </SimulationProvider>
  );
}

// ---------------------------------------------------------------------------
// Shared context provider
// ---------------------------------------------------------------------------

function SimulationProvider<Data, Params>({
  snapshot,
  backend,
  children,
}: {
  snapshot: State<Data, Params>;
  backend: Backend<Data, Params>;
  children?: React.ReactNode;
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

  const value = React.useMemo(
    (): SimulationContextValue<Data, Params> => ({
      data: snapshot.data,
      params: snapshot.params,
      tick: snapshot.tick,
      status: snapshot.status,
      play,
      pause,
      stop,
      seek,
      advance,
      setParams,
      resetWith,
    }),
    [snapshot, play, pause, stop, seek, advance, setParams, resetWith]
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
    }),
    [backend]
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

export function Simulation<Data, Params = Record<string, never>>(
  props: SimulationProps<Data, Params>
) {
  if ('worker' in props && props.worker != null) {
    return <WorkerSimulation {...(props as SimulationPropsWorker<Data, Params>)} />;
  }
  // Normalize sim={module} and inline forms into the same parts-shaped props.
  if ('sim' in props && props.sim != null) {
    const { sim, ...rest } = props as SimulationPropsLocal<Data, Params>;
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
  return <LocalSimulation {...(props as SimulationPropsInline<Data, Params>)} />;
}

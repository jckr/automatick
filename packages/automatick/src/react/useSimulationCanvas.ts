import React from 'react';
import type { EngineSnapshot } from '../engine';
import type { SimModule } from '../sim';
import { EngineContext } from './EngineContext';

/**
 * Draw callback signature for useSimulationCanvas.
 * Called imperatively on every engine snapshot — no React re-render involved.
 */
export type CanvasDrawFn<Data, Params> = (
  ctx: CanvasRenderingContext2D,
  snapshot: { data: Data; params: Params; tick: number }
) => void;

type InferDraw<T, FallbackParams> = T extends SimModule<infer D, infer P>
  ? CanvasDrawFn<D, P>
  : CanvasDrawFn<T, FallbackParams>;

/**
 * Subscribe to simulation snapshots and draw to a canvas without React re-renders.
 *
 * Returns a ref to attach to a `<canvas>` element. The `draw` callback is called
 * directly from the engine's subscription — it bypasses React's state/reconciliation
 * entirely. Draw timing is recorded automatically to the engine's performance buffer.
 *
 * For DOM/React rendering, use `useSimulation()` instead.
 *
 * @example
 * ```tsx
 * function BoidsCanvas() {
 *   const canvasRef = useSimulationCanvas<typeof boidsSim>((ctx, { data, params }) => {
 *     ctx.clearRect(0, 0, params.width, params.height);
 *     data.forEach(boid => {
 *       ctx.fillRect(boid.x, boid.y, 3, 3);
 *     });
 *   });
 *   return <canvas ref={canvasRef} width={400} height={400} />;
 * }
 * ```
 */
export function useSimulationCanvas<T = unknown, FallbackParams = unknown>(
  draw: InferDraw<T, FallbackParams>
): React.RefObject<HTMLCanvasElement> {
  const engineCtx = React.useContext(EngineContext);
  if (!engineCtx) {
    throw new Error(
      'useSimulationCanvas must be used within a <Simulation>'
    );
  }

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawRef = React.useRef(draw);
  drawRef.current = draw;

  React.useEffect(() => {
    // Draw the initial frame
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const snap = engineCtx.getSnapshot();
        const t0 = performance.now();
        (drawRef.current as CanvasDrawFn<unknown, unknown>)(ctx, {
          data: snap.data,
          params: snap.params,
          tick: snap.tick,
        });
        engineCtx.recordDrawTime(snap.tick, performance.now() - t0);
      }
    }

    // Subscribe to engine — draw on every snapshot, no setState
    const unsubscribe = engineCtx.subscribe(
      (snap: EngineSnapshot<unknown, unknown>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const t0 = performance.now();
        (drawRef.current as CanvasDrawFn<unknown, unknown>)(ctx, {
          data: snap.data,
          params: snap.params,
          tick: snap.tick,
        });
        engineCtx.recordDrawTime(snap.tick, performance.now() - t0);
      }
    );

    return unsubscribe;
  }, [engineCtx]);

  return canvasRef;
}

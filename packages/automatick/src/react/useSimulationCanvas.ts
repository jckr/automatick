import React from 'react';
import type { SimModule } from '../sim';
import { attachCanvas, attachCanvasLegacy } from '../canvas';
import type { CanvasDrawFn } from '../canvas';
import { EngineContext } from './EngineContext';

/**
 * Draw callback signature for useSimulationCanvas — re-exported from
 * `automatick/canvas`. Called imperatively on every engine state emit, no
 * React re-render involved. The third {@link CanvasView} argument is the
 * injected view toolkit; existing two-argument draw functions
 * `(ctx, snapshot) => void` remain assignable and keep working unchanged.
 */

type InferDraw<T, FallbackParams> = T extends SimModule<infer D, infer P>
  ? CanvasDrawFn<D, P>
  : CanvasDrawFn<T, FallbackParams>;

/** Logical (CSS px) canvas size for ownership mode. */
export type UseSimulationCanvasOptions = {
  width: number;
  height: number;
};

/**
 * Subscribe to simulation state and draw to a canvas without React re-renders.
 *
 * Returns a ref to attach to a `<canvas>` element. The `draw` callback is
 * called directly from the engine's subscription — it bypasses React's
 * state/reconciliation entirely. Draw timing is recorded automatically to the
 * engine's performance buffer.
 *
 * Two modes:
 *
 * **Ownership mode** (recommended) — pass `{ width, height }` options. The
 * hook delegates to `attachCanvas` from `automatick/canvas`: it owns the
 * canvas backing store (`width × dpr` / `height × dpr` attributes), applies
 * the devicePixelRatio transform around every draw so you draw in CSS pixels,
 * tracks dpr changes, and injects the full {@link CanvasView} toolkit
 * (`clear`, `fade`, `theme`, `blitGrid`) as the draw function's third
 * argument. Do not set `width`/`height` attributes on the `<canvas>` element
 * yourself — but do set its CSS size (e.g. `style={{ width, height }}`).
 *
 * **Legacy mode** — omit options. The canvas is never resized and no
 * transform is applied: you size the element (`width={W * dpr}`) and manage
 * the dpr transform yourself, exactly as before this hook gained options.
 * A `view` is still passed as a third argument (harmless to two-argument
 * draw functions) with `width`/`height` derived from the backing store
 * divided by `devicePixelRatio`.
 *
 * For DOM/React rendering, use `useSimulation()` instead.
 *
 * @example Ownership mode
 * ```tsx
 * function BoidsCanvas() {
 *   const canvasRef = useSimulationCanvas<typeof boidsSim>(
 *     (ctx, { data }, view) => {
 *       view.clear(view.theme('--bg2', '#fff'));
 *       data.boids.forEach((b) => ctx.fillRect(b.x, b.y, 3, 3));
 *     },
 *     { width: 400, height: 400 }
 *   );
 *   return <canvas ref={canvasRef} style={{ width: 400, height: 400 }} />;
 * }
 * ```
 *
 * @example Legacy mode (pre-existing call sites, unchanged behavior)
 * ```tsx
 * function BoidsCanvas() {
 *   const dpr = window.devicePixelRatio || 1;
 *   const canvasRef = useSimulationCanvas<typeof boidsSim>((ctx, { data }) => {
 *     ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
 *     ctx.clearRect(0, 0, 400, 400);
 *     data.boids.forEach((b) => ctx.fillRect(b.x, b.y, 3, 3));
 *     ctx.setTransform(1, 0, 0, 1, 0, 0);
 *   });
 *   return <canvas ref={canvasRef} width={400 * dpr} height={400 * dpr} />;
 * }
 * ```
 */
export function useSimulationCanvas<T = unknown, FallbackParams = unknown>(
  draw: InferDraw<T, FallbackParams>,
  options?: UseSimulationCanvasOptions
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

  const width = options?.width;
  const height = options?.height;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Stable wrapper so attachCanvas always sees the latest draw closure.
    // TODO(#14): re-narrow from EngineContext's erased generics. Drop once
    // EngineContext carries Data/Params.
    const drawFn: CanvasDrawFn<unknown, unknown> = (ctx, snap, view) =>
      (drawRef.current as CanvasDrawFn<unknown, unknown>)(ctx, snap, view);

    const detach =
      width !== undefined && height !== undefined
        ? attachCanvas(engineCtx, canvas, drawFn, { width, height })
        : attachCanvasLegacy(engineCtx, canvas, drawFn);

    // When the surrounding <Simulation> opted into pauseWhenHidden, hand it
    // this canvas as the element whose visibility gates the frame clock. No-op
    // otherwise (registerVisibilityTarget is absent).
    const unregister = engineCtx.registerVisibilityTarget?.(canvas);

    return () => {
      detach();
      unregister?.();
    };
  }, [engineCtx, width, height]);

  return canvasRef;
}

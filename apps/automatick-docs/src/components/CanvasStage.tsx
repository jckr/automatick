import React from 'react';
import { PerformanceOverlay } from 'automatick/react/performance';

type Props = {
  /** Maximum CSS width of the canvas (it scales down on narrower viewports). */
  maxWidth?: number;
  /** Minimum height of the stage cell. */
  minHeight?: number;
  /** Show the perf overlay in the top-right corner. Default true. */
  showPerf?: boolean;
  /** The <canvas> element. */
  children: React.ReactNode;
};

/**
 * Stage wrapper for fixed-aspect canvas demos: centers the canvas, scales it
 * down to fit narrow viewports while preserving aspect, optionally overlays
 * the PerformanceOverlay in the corner.
 */
export function CanvasStage({
  maxWidth = 600,
  minHeight = 540,
  showPerf = true,
  children,
}: Props) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        minHeight,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth, lineHeight: 0 }}>{children}</div>
      {showPerf ? (
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <PerformanceOverlay />
        </div>
      ) : null}
    </div>
  );
}

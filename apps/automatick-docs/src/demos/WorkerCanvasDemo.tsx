import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import xorRingSim from '../sims/xorRingSim';

const ROW_HEIGHT = 1;
const MAX_ROWS = 200;

function XorRingCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssWidth = 600;
  const cssHeight = 500;

  // Accumulate history for visual stacking
  const historyRef = React.useRef<number[][]>([]);
  const lastTickRef = React.useRef(-1);

  const canvasRef = useSimulationCanvas<typeof xorRingSim>((ctx, { data, params, tick }) => {
    if (!data) return;

    if (tick === 0) {
      historyRef.current = [];
      lastTickRef.current = -1;
    }

    // Only push if this is a new tick
    if (tick > lastTickRef.current) {
      historyRef.current.push([...data]);
      lastTickRef.current = tick;
    }
    // Keep only the last MAX_ROWS
    if (historyRef.current.length > MAX_ROWS) {
      historyRef.current = historyRef.current.slice(-MAX_ROWS);
    }

    const { cells } = params;
    const simW = cells;
    const simH = MAX_ROWS * ROW_HEIGHT;
    const scaleX = (cssWidth * dpr) / simW;
    const scaleY = (cssHeight * dpr) / simH;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    const rows = historyRef.current;

    ctx.fillStyle = '#f6f6f6';
    ctx.fillRect(0, 0, simW, simH);

    ctx.fillStyle = '#111';
    rows.forEach((row, rowIdx) => {
      for (let i = 0; i < cells; i++) {
        if (row[i]) {
          ctx.fillRect(i, rowIdx * ROW_HEIGHT, 1, ROW_HEIGHT);
        }
      }
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={cssWidth * dpr}
      height={cssHeight * dpr}
      style={{
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: 6,
        width: '100%',
        height: 'auto',
        imageRendering: 'pixelated',
      }}
    />
  );
}

export function WorkerCanvasDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={xorRingSim} maxTime={5000} delayMs={50}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          maxTime={5000}
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'cells',
              label: 'Cells',
              min: 50,
              max: 500,
              step: 10,
            },
            {
              type: 'range',
              param: 'density',
              label: 'Initial density',
              min: 0,
              max: 1,
              step: 0.05,
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <XorRingCanvas />
          {showPerf && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <PerformanceOverlay />
            </div>
          )}
        </div>
      </div>
    </Simulation>
  );
}

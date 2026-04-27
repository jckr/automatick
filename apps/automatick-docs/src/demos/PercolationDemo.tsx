import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import percolationSim, {
  ROCK,
  WATER_FROM_TOP,
  WATER_FROM_LEFT,
  WATER_FROM_RIGHT,
} from '../sims/percolationSim';

const CELL_PX = 6;

function cellColor(cell: number): string {
  if (cell === ROCK) return '#555';
  if (cell === WATER_FROM_TOP || cell === WATER_FROM_LEFT || cell === WATER_FROM_RIGHT)
    return '#38bdf8';
  // EMPTY
  return '#f0ebe3';
}

function PercolationGrid() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssSize = 600;
  const { data } = useSimulation<typeof percolationSim>();

  const borderColor =
    data.result === 'success'
      ? '#3366ee'
      : data.result === 'failure'
        ? '#777'
        : 'transparent';

  const canvasRef = useSimulationCanvas<typeof percolationSim>((ctx, { data, params }) => {
    const simW = params.width * CELL_PX;
    const simH = params.height * CELL_PX;
    const scaleX = (cssSize * dpr) / simW;
    const scaleY = (cssSize * dpr) / simH;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    ctx.fillStyle = '#f0ebe3';
    ctx.fillRect(0, 0, simW, simH);

    for (let y = 0; y < data.grid.length; y++) {
      const row = data.grid[y];
      for (let x = 0; x < row.length; x++) {
        const color = cellColor(row[x]);
        if (color !== '#f0ebe3') {
          ctx.fillStyle = color;
          ctx.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX, CELL_PX);
        }
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <div
      style={{
        border: `3px solid ${borderColor}`,
        borderRadius: 4,
        display: 'inline-block',
      }}
    >
      <canvas
        ref={canvasRef}
        width={cssSize * dpr}
        height={cssSize * dpr}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </div>
  );
}

export function PercolationDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={percolationSim} maxTime={Infinity} delayMs={30}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          maxTime={10000}
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'porosity',
              label: 'Porosity',
              min: 0,
              max: 1,
              step: 0.01,
            },
            {
              type: 'range',
              param: 'width',
              label: 'Grid width',
              min: 10,
              max: 100,
              step: 1,
            },
            {
              type: 'range',
              param: 'height',
              label: 'Grid height',
              min: 10,
              max: 100,
              step: 1,
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <PercolationGrid />
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

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import activatorsSim from '../sims/activatorsSim';

const CELL_PX = 10;

function ActivatorsCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssSize = 600;

  const canvasRef = useSimulationCanvas<typeof activatorsSim>((ctx, { data, params }) => {
    const simW = params.width * CELL_PX;
    const simH = params.height * CELL_PX;
    const scale = (cssSize * dpr) / simW;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    ctx.clearRect(0, 0, simW, simH);

    for (let row = 0; row < data.grid.length; row++) {
      for (let col = 0; col < data.grid[row].length; col++) {
        ctx.fillStyle = data.grid[row][col] ? '#1a1a1a' : '#f3f3f3';
        ctx.fillRect(col * CELL_PX, row * CELL_PX, CELL_PX, CELL_PX);
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={cssSize * dpr}
      height={cssSize * dpr}
      style={{ border: '1px solid rgba(0,0,0,0.2)', borderRadius: 6, width: '100%', height: 'auto' }}
    />
  );
}

export function ActivatorsDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={activatorsSim} maxTime={200} delayMs={100}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          maxTime={200}
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'innerRadius',
              label: 'Inner Radius',
              min: 1,
              max: 10,
              step: 1,
            },
            {
              type: 'range',
              param: 'outerRadius',
              label: 'Outer Radius',
              min: 1,
              max: 10,
              step: 1,
            },
            {
              type: 'range',
              param: 'w',
              label: 'Weight',
              min: 0,
              max: 1,
              step: 0.01,
            },
            {
              type: 'range',
              param: 'density',
              label: 'Density',
              min: 0,
              max: 1,
              step: 0.1,
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <ActivatorsCanvas />
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

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { StandardControls } from 'automatick/react/controls';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { PerformanceOverlay } from 'automatick/react/performance';
import segregationSim from '../sims/segregationSim';
import { defaultParams, draw } from '../sims/segregationSim';

function SegregationLocalCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssSize = defaultParams.width;

  const canvasRef = useSimulationCanvas<typeof segregationSim>((ctx, { data, params }) => {
    const scale = (cssSize * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    draw({ ctx, snapshot: { data, params } });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={cssSize * dpr}
      height={cssSize * dpr}
      style={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', width: '100%', height: 'auto' }}
    />
  );
}

export function SegregationLocalDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation
      sim={segregationSim}
      maxTime={50}
      delayMs={100}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <SegregationLocalCanvas />
          {showPerf && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <PerformanceOverlay />
            </div>
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <StandardControls
          maxTime={50}
          showStepButton
          controls={[
            { type: 'range', param: 'tolerance', label: 'Tolerance', min: 0, max: 100, step: 1 },
            { type: 'range', param: 'proportion', label: 'Proportion', min: 0, max: 100, step: 1 },
            { type: 'range', param: 'threshold', label: 'Threshold', min: 0, max: 100, step: 1 },
            { type: 'toggle', param: 'showmoves', label: 'Show moves' }
          ]}
        />
      </div>
    </Simulation>
  );
}

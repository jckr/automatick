import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import segregationSim, { draw } from '../sims/segregationSim';

function SegregationCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssSize = 600;

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
      style={{ border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, width: '100%', height: 'auto' }}
    />
  );
}

function SegregationStats() {
  const { data } = useSimulation<typeof segregationSim>();
  if (!data) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span>Happiness: {(data.happiness * 100).toFixed(1)}%</span>
      <span>Total moves: {data.totalMoves}</span>
    </div>
  );
}

export function SegregationDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={segregationSim} maxTime={500} delayMs={50}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          maxTime={500}
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'tolerance',
              label: 'Tolerance (%)',
              min: 0,
              max: 100,
              step: 1,
            },
            {
              type: 'range',
              param: 'proportion',
              label: 'Proportion (%)',
              min: 10,
              max: 90,
              step: 1,
            },
            {
              type: 'range',
              param: 'threshold',
              label: 'Threshold (%)',
              min: 50,
              max: 100,
              step: 1,
            },
            {
              type: 'toggle',
              param: 'showmoves',
              label: 'Show moves',
            },
          ]}
        />
        <SegregationStats />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <SegregationCanvas />
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

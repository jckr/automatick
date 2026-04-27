import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import langtonAntSim from '../sims/langtonAntSim';

function LangtonCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssSize = 600;

  const canvasRef = useSimulationCanvas<typeof langtonAntSim>((ctx, { data, params }) => {
    const scale = (cssSize * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const { gridWidth: gw, gridHeight: gh, cells, antX, antY } = data;
    const cellW = params.width / gw;
    const cellH = params.height / gh;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, params.width, params.height);

    ctx.fillStyle = '#111';
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        if (cells[y * gw + x]) {
          ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
        }
      }
    }

    // Draw ant
    ctx.fillStyle = '#e53935';
    ctx.fillRect(antX * cellW, antY * cellH, cellW, cellH);

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

export function LangtonAntDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={langtonAntSim} maxTime={50000} delayMs={0} ticksPerFrame={10}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          maxTime={50000}
          showStepButton
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <LangtonCanvas />
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

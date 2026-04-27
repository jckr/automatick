import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import sphFluidSim from '../sims/sphFluidSim';

const WIDTH = 600;
const HEIGHT = 400;

function SphFluidCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssWidth = WIDTH;
  const cssHeight = HEIGHT;

  const canvasRef = useSimulationCanvas<typeof sphFluidSim>((ctx, { data }) => {
    const scale = (cssWidth * dpr) / WIDTH;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    ctx.fillStyle = '#0a1020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const { x, y, vx, vy, count } = data;
    for (let i = 0; i < count; i++) {
      const speed = Math.hypot(vx[i], vy[i]);
      const t = Math.min(speed / 300, 1);
      ctx.fillStyle = `hsl(${220 - t * 180}, 80%, ${50 + t * 30}%)`;
      ctx.fillRect(x[i] - 2, y[i] - 2, 4, 4);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={cssWidth * dpr}
      height={cssHeight * dpr}
      style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: 'auto' }}
    />
  );
}

export function SphFluidDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={sphFluidSim} delayMs={0} autoplay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'count',
              label: 'Particles (reset to apply)',
              min: 500,
              max: 3000,
              step: 100,
            },
            {
              type: 'range',
              param: 'gasK',
              label: 'Stiffness (gasK)',
              min: 500,
              max: 5000,
              step: 100,
            },
            {
              type: 'range',
              param: 'mu',
              label: 'Viscosity (mu)',
              min: 0,
              max: 1000,
              step: 50,
            },
            {
              type: 'range',
              param: 'gravityY',
              label: 'Gravity',
              min: 0,
              max: 4000,
              step: 100,
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <SphFluidCanvas />
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

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import sphFluidSim from '../sims/sphFluidSim';

const WIDTH = 600;
const HEIGHT = 400;

function SphFluidCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const canvasRef = useSimulationCanvas<typeof sphFluidSim>((ctx, { data }) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    <CanvasStage maxWidth={WIDTH} minHeight={420}>
      <canvas
        ref={canvasRef}
        width={WIDTH * dpr}
        height={HEIGHT * dpr}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
      />
    </CanvasStage>
  );
}

const SPH_GROUPS: DemoControlGroup[] = [
  {
    label: 'Fluid (resets)',
    controls: [
      {
        type: 'range',
        param: 'count',
        label: 'Particles',
        min: 500,
        max: 3000,
        step: 100,
      },
    ],
  },
  {
    label: 'Forces',
    controls: [
      {
        type: 'range',
        param: 'gasK',
        label: 'Stiffness',
        min: 500,
        max: 5000,
        step: 100,
      },
      {
        type: 'range',
        param: 'mu',
        label: 'Viscosity',
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
    ],
  },
];

export function SphFluidDemo() {
  return (
    <Simulation sim={sphFluidSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<SphFluidCanvas />}
        controls={<DemoControlPanel groups={SPH_GROUPS} showStep />}
      />
    </Simulation>
  );
}

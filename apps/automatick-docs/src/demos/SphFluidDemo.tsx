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
import { sphFluidPalette } from '../theme/palette';
import styles from './SphFluidDemo.module.css';

const WIDTH = 600;
const HEIGHT = 400;

function SphFluidCanvas() {
  const canvasRef = useSimulationCanvas<typeof sphFluidSim>(
    (ctx, { data }, view) => {
      view.clear(sphFluidPalette.bg);

      const { x, y, vx, vy, count } = data;
      for (let i = 0; i < count; i++) {
        const speed = Math.hypot(vx[i], vy[i]);
        const t = Math.min(speed / 300, 1);
        ctx.fillStyle = `hsl(${sphFluidPalette.hueBase - t * sphFluidPalette.hueSpan}, ${sphFluidPalette.saturation}%, ${sphFluidPalette.lightBase + t * sphFluidPalette.lightSpan}%)`;
        ctx.fillRect(x[i] - 2, y[i] - 2, 4, 4);
      }
    },
    { width: WIDTH, height: HEIGHT }
  );

  return (
    <CanvasStage maxWidth={WIDTH} minHeight={420}>
      <canvas ref={canvasRef} className={styles.canvas} />
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

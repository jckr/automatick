import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import physarumSim from '../sims/physarumSim';
import styles from './PhysarumDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function PhysarumCanvas() {
  const canvasRef = useSimulationCanvas<typeof physarumSim>(
    (ctx, { data }, view) => {
      const w = data.width;
      const h = data.height;
      const trail = data.trail;

      // Map trail concentration to a dark -> bright (cyan/white) palette.
      view.blitGrid(w, h, (px) => {
        for (let i = 0; i < w * h; i++) {
          const t = Math.min(1, trail[i] / 6);
          // dark teal background -> cyan -> white as concentration rises.
          const r = Math.floor(8 + t * t * 247);
          const g = Math.floor(14 + t * 200 + t * t * 41);
          const b = Math.floor(24 + t * 180 + t * t * 51);
          const j = i * 4;
          px[j] = r;
          px[j + 1] = Math.min(255, g);
          px[j + 2] = Math.min(255, b);
          px[j + 3] = 255;
        }
      });
    },
    { width: WIDTH, height: HEIGHT }
  );

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const PHYSARUM_GROUPS: DemoControlGroup[] = [
  {
    label: 'Agents',
    controls: [
      {
        type: 'range',
        param: 'numAgents',
        label: 'Agents',
        min: 1000,
        max: 20000,
        step: 1000,
      },
      {
        type: 'range',
        param: 'sensorAngle',
        label: 'Sensor angle',
        min: 0.1,
        max: 1.5,
        step: 0.1,
      },
      {
        type: 'range',
        param: 'sensorDistance',
        label: 'Sensor dist',
        min: 3,
        max: 30,
        step: 1,
      },
      {
        type: 'range',
        param: 'turnSpeed',
        label: 'Turn speed',
        min: 0.1,
        max: 1.5,
        step: 0.1,
      },
    ],
  },
  {
    label: 'Trail',
    controls: [
      {
        type: 'range',
        param: 'decayRate',
        label: 'Decay',
        min: 0.8,
        max: 0.99,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'depositAmount',
        label: 'Deposit',
        min: 0.5,
        max: 5,
        step: 0.5,
      },
    ],
  },
];

export function PhysarumDemo() {
  return (
    <Simulation sim={physarumSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<PhysarumCanvas />}
        controls={<DemoControlPanel groups={PHYSARUM_GROUPS} />}
      />
    </Simulation>
  );
}

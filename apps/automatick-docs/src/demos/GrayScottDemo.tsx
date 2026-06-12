import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import grayScottSim from '../sims/grayScottSim';
import styles from './GrayScottDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function GrayScottCanvas() {
  const canvasRef = useSimulationCanvas<typeof grayScottSim>(
    (ctx, { data }, view) => {
      const w = data.width;
      const h = data.height;
      view.blitGrid(w, h, (px) => {
        for (let i = 0; i < w * h; i++) {
          const vRaw = data.v[i];
          const t = Math.min(Math.max(vRaw * 2.5, 0), 1);
          let r: number;
          let g: number;
          let b: number;
          if (t < 0.5) {
            const s = t * 2;
            r = Math.floor(20 + s * 220);
            g = Math.floor(30 + s * 200);
            b = Math.floor(90 + s * 40);
          } else {
            const s = (t - 0.5) * 2;
            r = Math.floor(240 - s * 20);
            g = Math.floor(230 - s * 180);
            b = Math.floor(130 - s * 110);
          }
          const j = i * 4;
          px[j] = r;
          px[j + 1] = g;
          px[j + 2] = b;
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

const GRAY_SCOTT_GROUPS: DemoControlGroup[] = [
  {
    label: 'Reaction',
    controls: [
      {
        type: 'range',
        param: 'F',
        label: 'Feed (F)',
        min: 0.01,
        max: 0.08,
        step: 0.001,
      },
      {
        type: 'range',
        param: 'k',
        label: 'Kill (k)',
        min: 0.04,
        max: 0.08,
        step: 0.001,
      },
    ],
  },
  {
    label: 'Integration',
    controls: [
      {
        type: 'range',
        param: 'dt',
        label: 'Timestep',
        min: 0.5,
        max: 1.5,
        step: 0.1,
      },
      {
        type: 'range',
        param: 'subTicks',
        label: 'Sub-ticks',
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
];

export function GrayScottDemo() {
  return (
    <Simulation sim={grayScottSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<GrayScottCanvas />}
        controls={<DemoControlPanel groups={GRAY_SCOTT_GROUPS} showStep />}
      />
    </Simulation>
  );
}

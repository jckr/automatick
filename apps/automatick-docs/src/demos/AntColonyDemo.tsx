import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import antColonySim from '../sims/antColonySim';
import { antColonyPalette, antColonyBlit } from '../theme/palette';
import styles from './AntColonyDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;
const HOME_X = 100;
const HOME_Y = 100;
const HOME_RADIUS = 5;

function AntColonyCanvas() {
  const canvasRef = useSimulationCanvas<typeof antColonySim>(
    (ctx, { data }, view) => {
      const w = data.width;
      const h = data.height;

      view.blitGrid(w, h, (px) => {
        for (let i = 0; i < w * h; i++) {
          const f = Math.min(data.foodPher[i] * 0.5, 1);
          const hpv = Math.min(data.homePher[i] * 0.5, 1);
          const hasFood = data.food[i] > 0;
          const j = i * 4;
          if (hasFood) {
            px[j] = antColonyBlit.foodR;
            px[j + 1] = antColonyBlit.foodG;
            px[j + 2] = antColonyBlit.foodB;
            px[j + 3] = antColonyBlit.foodA;
          } else {
            px[j] = antColonyBlit.baseR + hpv * antColonyBlit.homeRScale;
            px[j + 1] = antColonyBlit.baseG + f * antColonyBlit.foodGScale;
            px[j + 2] =
              antColonyBlit.baseB +
              hpv * antColonyBlit.homeBScale +
              f * antColonyBlit.foodBScale;
            px[j + 3] = antColonyBlit.alpha;
          }
        }
      });

      const cellPx = WIDTH / w;
      ctx.fillStyle = antColonyPalette.home;
      ctx.beginPath();
      ctx.arc(HOME_X * cellPx, HOME_Y * cellPx, HOME_RADIUS * cellPx, 0, Math.PI * 2);
      ctx.fill();

      const n = data.antX.length;
      for (let i = 0; i < n; i++) {
        const ax = data.antX[i] * cellPx;
        const ay = data.antY[i] * cellPx;
        ctx.fillStyle =
          data.antCarrying[i] === 1
            ? antColonyPalette.antCarrying
            : antColonyPalette.antEmpty;
        ctx.fillRect(ax - 1, ay - 1, 2, 2);
      }
    },
    { width: WIDTH, height: HEIGHT }
  );

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const ANT_GROUPS: DemoControlGroup[] = [
  {
    label: 'Colony',
    controls: [
      {
        type: 'range',
        param: 'antCount',
        label: 'Ants',
        min: 100,
        max: 2000,
        step: 50,
      },
    ],
  },
  {
    label: 'Pheromones',
    controls: [
      {
        type: 'range',
        param: 'evaporation',
        label: 'Evaporation',
        min: 0,
        max: 0.05,
        step: 0.005,
      },
      {
        type: 'range',
        param: 'depositAmount',
        label: 'Deposit',
        min: 0.1,
        max: 2,
        step: 0.1,
      },
    ],
  },
  {
    label: 'Sensors',
    controls: [
      {
        type: 'range',
        param: 'sensorAngle',
        label: 'Angle',
        min: 0.1,
        max: 1.2,
        step: 0.05,
      },
    ],
  },
];

export function AntColonyDemo() {
  return (
    <Simulation sim={antColonySim} delayMs={0} autoplay>
      <DemoSplit
        preview={<AntColonyCanvas />}
        controls={<DemoControlPanel groups={ANT_GROUPS} showStep />}
      />
    </Simulation>
  );
}

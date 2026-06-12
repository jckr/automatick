import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import sandpileSim, {
  SANDPILE_WIDTH,
  SANDPILE_HEIGHT,
} from '../sims/sandpileSim';
import styles from './SandpileDemo.module.css';

const CSS_SIZE = 600;

const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [26, 26, 42],
  [80, 180, 120],
  [230, 210, 70],
  [240, 140, 40],
  [255, 70, 70],
];

function SandpileCanvas() {
  const canvasRef = useSimulationCanvas<typeof sandpileSim>(
    (ctx, { data }, view) => {
      const W = SANDPILE_WIDTH;
      const H = SANDPILE_HEIGHT;
      view.blitGrid(W, H, (px) => {
        const grid = data.grid;
        for (let i = 0; i < W * H; i++) {
          const c = grid[i];
          const p = PALETTE[c < 4 ? c : 4];
          const j = i * 4;
          px[j] = p[0];
          px[j + 1] = p[1];
          px[j + 2] = p[2];
          px[j + 3] = 255;
        }
      });
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const SAND_GROUPS: DemoControlGroup[] = [
  {
    label: 'Drop',
    controls: [
      {
        type: 'range',
        param: 'grainsPerTick',
        label: 'Grains / tick',
        min: 1,
        max: 100,
        step: 1,
      },
    ],
  },
];

export function SandpileDemo() {
  return (
    <Simulation sim={sandpileSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<SandpileCanvas />}
        controls={<DemoControlPanel groups={SAND_GROUPS} showStep />}
      />
    </Simulation>
  );
}

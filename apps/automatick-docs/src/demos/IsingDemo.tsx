import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import isingSim from '../sims/isingSim';
import styles from './IsingDemo.module.css';

const GRID = 200;
const CSS_SIZE = 600;

function IsingCanvas() {
  const canvasRef = useSimulationCanvas<typeof isingSim>(
    (ctx, { data }, view) => {
      view.blitGrid(GRID, GRID, (px) => {
        for (let i = 0; i < GRID * GRID; i++) {
          const s = data.spins[i];
          const j = i * 4;
          if (s > 0) {
            px[j] = 240;
            px[j + 1] = 230;
            px[j + 2] = 210;
          } else {
            px[j] = 25;
            px[j + 1] = 35;
            px[j + 2] = 70;
          }
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

function IsingStats() {
  const { data } = useSimulation<typeof isingSim>();
  return (
    <div className='group'>
      <div className='g-lbl'>Readouts</div>
      <div className={styles.stats}>
        <div className={styles.row}>
          <span className={styles.label}>magnetization</span>
          <span className={styles.value}>{data.magnetization.toFixed(3)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>energy</span>
          <span className={styles.value}>{data.energy.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

const ISING_GROUPS: DemoControlGroup[] = [
  {
    label: 'Field',
    controls: [
      {
        type: 'range',
        param: 'T',
        label: 'Temperature',
        min: 0.5,
        max: 5,
        step: 0.05,
      },
      {
        type: 'range',
        param: 'externalField',
        label: 'External field',
        min: -1,
        max: 1,
        step: 0.05,
      },
    ],
  },
  {
    label: 'Compute',
    controls: [
      {
        type: 'range',
        param: 'sweepsPerTick',
        label: 'Sweeps / tick',
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
];

export function IsingDemo() {
  return (
    <Simulation sim={isingSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<IsingCanvas />}
        controls={
          <DemoControlPanel
            groups={ISING_GROUPS}
            extra={<IsingStats />}
            showStep
          />
        }
      />
    </Simulation>
  );
}

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { PerformanceOverlay } from 'automatick/react/performance';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import percolationSim, {
  ROCK,
  WATER_FROM_TOP,
  WATER_FROM_LEFT,
  WATER_FROM_RIGHT,
} from '../sims/percolationSim';
import styles from './PercolationDemo.module.css';

const CSS_SIZE = 600;

// #555 rock, #38bdf8 water, #f0ebe3 open.
const ROCK_RGB: readonly [number, number, number] = [85, 85, 85];
const WATER_RGB: readonly [number, number, number] = [56, 189, 248];
const OPEN_RGB: readonly [number, number, number] = [240, 235, 227];

function cellRgb(cell: number): readonly [number, number, number] {
  if (cell === ROCK) return ROCK_RGB;
  if (
    cell === WATER_FROM_TOP ||
    cell === WATER_FROM_LEFT ||
    cell === WATER_FROM_RIGHT
  ) {
    return WATER_RGB;
  }
  return OPEN_RGB;
}

function PercolationGrid() {
  const { data } = useSimulation<typeof percolationSim>();

  const borderColor =
    data.result === 'success'
      ? 'var(--info)'
      : data.result === 'failure'
        ? 'var(--fg3)'
        : 'transparent';

  const canvasRef = useSimulationCanvas<typeof percolationSim>(
    (ctx, { data }, view) => {
      const rows = data.grid.length;
      const cols = rows > 0 ? data.grid[0].length : 0;
      if (!rows || !cols) return;
      view.blitGrid(cols, rows, (px) => {
        let j = 0;
        for (let y = 0; y < rows; y++) {
          const row = data.grid[y];
          for (let x = 0; x < cols; x++, j += 4) {
            const c = cellRgb(row[x]);
            px[j] = c[0];
            px[j + 1] = c[1];
            px[j + 2] = c[2];
            px[j + 3] = 255;
          }
        }
      });
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <div className={styles.stage}>
      <div
        className={styles.frame}
        style={{ border: `3px solid ${borderColor}` }}
      >
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <div className={styles.perf}>
        <PerformanceOverlay />
      </div>
    </div>
  );
}

const PERC_GROUPS: DemoControlGroup[] = [
  {
    label: 'Lattice',
    controls: [
      {
        type: 'range',
        param: 'porosity',
        label: 'Porosity',
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'width',
        label: 'Width',
        min: 10,
        max: 100,
        step: 1,
      },
      {
        type: 'range',
        param: 'height',
        label: 'Height',
        min: 10,
        max: 100,
        step: 1,
      },
    ],
  },
];

export function PercolationDemo() {
  return (
    <Simulation sim={percolationSim} maxTime={Infinity} delayMs={30}>
      <DemoSplit
        preview={<PercolationGrid />}
        controls={<DemoControlPanel groups={PERC_GROUPS} showStep />}
      />
    </Simulation>
  );
}

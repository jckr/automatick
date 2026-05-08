import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import gameOfLifeSim from '../sims/gameOfLifeSim';
import styles from './GameOfLifeDemo.module.css';

function LifeGrid() {
  const { data, params } = useSimulation<typeof gameOfLifeSim>();
  // Compute cell size to fill a 520px-tall stage with the current grid.
  const cellPx = Math.floor(520 / params.height);

  return (
    <div
      role='img'
      aria-label='Game of Life grid'
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${params.width}, ${cellPx}px)`,
        width: params.width * cellPx,
      }}
    >
      {data.grid.map((row, y) =>
        row.map((alive, x) => (
          <div
            key={`${x}-${y}`}
            className={alive ? `${styles.cell} ${styles.alive}` : styles.cell}
            style={{ width: cellPx, height: cellPx }}
          />
        ))
      )}
    </div>
  );
}

const LIFE_GROUPS: DemoControlGroup[] = [
  {
    label: 'Seed',
    controls: [
      {
        type: 'range',
        param: 'density',
        label: 'Density',
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => `${Math.round(v * 100)}%`,
      },
    ],
  },
];

export function GameOfLifeDemo() {
  return (
    <Simulation sim={gameOfLifeSim} maxTime={2000} delayMs={100}>
      <DemoSplit
        preview={
          <div className={styles.preview}>
            <LifeGrid />
          </div>
        }
        controls={<DemoControlPanel groups={LIFE_GROUPS} />}
      />
    </Simulation>
  );
}

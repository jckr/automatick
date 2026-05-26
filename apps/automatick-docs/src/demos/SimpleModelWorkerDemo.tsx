import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import type { Data, Params } from '../sims/simpleModelWorkerSim';
import styles from './SimpleModelWorkerDemo.module.css';

const SIZE = 10;
const CELL = 36;
const TOTAL = SIZE * SIZE;
const CELL_COLOR = 'rgba(215, 69, 30, 0.12)';

import simUrl from '../sims/simpleModelWorkerSim.ts?worker-module';

function Grid() {
  const canvasRef = useSimulationCanvas<Data, Params>((ctx, { data }) => {
    ctx.clearRect(0, 0, SIZE * CELL, SIZE * CELL);
    ctx.fillStyle = CELL_COLOR;
    for (let i = 0; i < TOTAL; i++) {
      if (data.cells[i]) {
        ctx.fillRect((i % SIZE) * CELL, Math.floor(i / SIZE) * CELL, CELL, CELL);
      }
    }
  });
  return (
    <canvas
      ref={canvasRef}
      width={SIZE * CELL}
      height={SIZE * CELL}
      className={styles.canvas}
    />
  );
}

export function SimpleModelWorkerDemo() {
  return (
    <div className={styles.wrap}>
      <Simulation<Data, Params> worker={simUrl} delayMs={100}>
        <Grid />
        <StandardControls />
      </Simulation>
    </div>
  );
}

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import type { Data, Params } from '../sims/simpleModelWorkerSim';
import { simpleModelPalette } from '../theme/palette';
import styles from './SimpleModelWorkerDemo.module.css';

const SIZE = 10;
const CELL = 36;
const TOTAL = SIZE * SIZE;
const CELL_COLOR = simpleModelPalette.cellFill;

import simUrl from '../sims/simpleModelWorkerSim.ts?worker-module';

function Grid() {
  const canvasRef = useSimulationCanvas<Data, Params>(
    (ctx, { data }, view) => {
      view.clear();
      ctx.fillStyle = CELL_COLOR;
      for (let i = 0; i < TOTAL; i++) {
        if (data.cells[i]) {
          ctx.fillRect((i % SIZE) * CELL, Math.floor(i / SIZE) * CELL, CELL, CELL);
        }
      }
    },
    { width: SIZE * CELL, height: SIZE * CELL }
  );
  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{ width: SIZE * CELL, height: SIZE * CELL }}
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

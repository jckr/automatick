import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import type { State } from 'automatick';
import { simpleModelPalette } from '../theme/palette';
import styles from './SimpleModelCanvasDemo.module.css';

const SIZE = 10;
const CELL = 36;
const TOTAL = SIZE * SIZE;
const CELL_COLOR = simpleModelPalette.cellFill;

type Data = { cells: boolean[] };
type Params = Record<string, never>;

const init: Data = { cells: new Array(TOTAL).fill(false) };

function step({ data, tick }: State<Data, Params>): Data {
  data.cells[tick - 1] = true;
  return data;
}

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

export function SimpleModelCanvasDemo() {
  return (
    <div className={styles.wrap}>
      <Simulation
        init={init}
        step={step}
        shouldStop={(d) => Boolean(d.cells.at(-1))}
        delayMs={100}
      >
        <Grid />
        <StandardControls />
      </Simulation>
    </div>
  );
}

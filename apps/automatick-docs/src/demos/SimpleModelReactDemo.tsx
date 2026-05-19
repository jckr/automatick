import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { StandardControls } from 'automatick/react/controls';
import type { State } from 'automatick';
import styles from './SimpleModelReactDemo.module.css';

const TOTAL = 100;

type Data = { cells: boolean[] };
type Params = Record<string, never>;

const init: Data = { cells: new Array(TOTAL).fill(false) };

function step({ data, tick }: State<Data, Params>): Data {
  data.cells[tick - 1] = true;
  return data;
}

function Grid() {
  const { data } = useSimulation<Data>();
  return (
    <div className={styles.grid}>
      {data.cells.map((on, i) => (
        <div
          key={i}
          className={on ? `${styles.cell} ${styles.on}` : styles.cell}
        />
      ))}
    </div>
  );
}

export function SimpleModelReactDemo() {
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

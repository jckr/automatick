import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import simpleModelSim from '../sims/simpleModelSim';
import styles from './SimpleModelDemo.module.css';

const GRID = 10;

function SimpleModelView() {
  const { tick } = useSimulation<typeof simpleModelSim>();
  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const on = 10 * Math.floor(i / GRID) + (i % GRID) <= tick;
          return (
            <div
              key={i}
              className={on ? `${styles.cell} ${styles.on}` : styles.cell}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SimpleModelDemo() {
  return (
    <Simulation sim={simpleModelSim} maxTime={100} delayMs={80}>
      <DemoSplit
        preview={<SimpleModelView />}
        controls={<DemoControlPanel groups={[]} showStep />}
      />
    </Simulation>
  );
}

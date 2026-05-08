import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import fibonacciSim from '../sims/fibonacciSim';
import styles from './FibonacciDemo.module.css';

function FibonacciView() {
  const { data } = useSimulation<typeof fibonacciSim>();
  return (
    <div className={styles.view}>
      <div className={styles.list}>
        {data.map((n, i) => (
          <div key={`fib-${i}-${n}`} className={styles.item}>
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FibonacciDemo() {
  return (
    <Simulation sim={fibonacciSim} maxTime={20} delayMs={200}>
      <DemoSplit
        preview={<FibonacciView />}
        controls={<DemoControlPanel groups={[]} showStep />}
      />
    </Simulation>
  );
}

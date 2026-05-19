import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import counterSim from '../sims/counterSim';
import styles from './CounterDemo.module.css';

function CounterView() {
  const { data } = useSimulation<typeof counterSim>();
  return (
    <div className={styles.view}>
      <div className={styles.value}>
        {data.value}
      </div>
    </div>
  );
}

const COUNTER_GROUPS: DemoControlGroup[] = [
  {
    label: 'Step',
    controls: [
      {
        type: 'range',
        param: 'step',
        label: 'Amount per tick',
        min: 0,
        max: 10,
        step: 1,
      },
    ],
  },
];

export function CounterDemo() {
  return (
    <Simulation sim={counterSim} maxTime={50} delayMs={0}>
      <DemoSplit
        preview={<CounterView />}
        controls={<DemoControlPanel groups={COUNTER_GROUPS} showStep />}
      />
    </Simulation>
  );
}

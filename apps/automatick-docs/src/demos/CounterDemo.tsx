import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import counterSim from '../sims/counterSim';

function CounterView() {
  const { data } = useSimulation<typeof counterSim>();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 360,
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontVariationSettings: '"opsz" 72',
          fontSize: 96,
          fontWeight: 500,
          color: 'var(--fg1)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
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

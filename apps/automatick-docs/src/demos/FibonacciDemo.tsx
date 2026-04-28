import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import fibonacciSim from '../sims/fibonacciSim';

function FibonacciView() {
  const { data } = useSimulation<typeof fibonacciSim>();
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
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          maxWidth: 720,
          justifyContent: 'center',
        }}
      >
        {data.map((n, i) => (
          <div
            key={`fib-${i}-${n}`}
            style={{
              padding: '10px 14px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              color: 'var(--fg1)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
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

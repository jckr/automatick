import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import simpleModelSim from '../sims/simpleModelSim';

const GRID = 10;
const CELL = 36;

function SimpleModelView() {
  const { tick } = useSimulation<typeof simpleModelSim>();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 420,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`,
          width: GRID * CELL,
          border: '1px solid var(--border)',
          background: 'var(--bg3)',
        }}
      >
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const on = 10 * Math.floor(i / GRID) + (i % GRID) <= tick;
          return (
            <div
              key={i}
              style={{
                width: CELL,
                height: CELL,
                boxSizing: 'border-box',
                background: on ? 'var(--accent-soft)' : 'transparent',
                borderRight: '1px solid rgba(0,0,0,0.04)',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
              }}
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

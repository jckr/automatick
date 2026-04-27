import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { CounterDemo } from '../../demos/CounterDemo';

export function CounterPage() {
  return (
    <ExamplePage
      title='Counter'
      description={
        <>
          <p>
            Minimal in-thread simulation showing the engine contract and
            composable controls.
          </p>
          <p>
            The simplest possible simulation: a counter that increments each
            tick. Demonstrates the basic defineSim / Simulation / useSimulation
            pattern.
          </p>
        </>
      }
    >
      <CounterDemo />
    </ExamplePage>
  );
}

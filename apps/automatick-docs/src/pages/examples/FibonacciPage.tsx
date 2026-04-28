import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { FibonacciDemo } from '../../demos/FibonacciDemo';

export function FibonacciPage() {
  return (
    <ExamplePage
      title='Fibonacci numbers'
      description={
        <>
          <p>
            Fibonacci sequence built step by step — main-thread{' '}
            <code>Simulation</code> (DOM).
          </p>
          <p>
            These examples are inspired by the Fibonacci sequence, where
            F&#8320; = 0, F&#8321; = 1, and F&#8345; = F&#8345;&#8331;&#8321;
            + F&#8345;&#8331;&#8322;. The ratio F&#8345; / F&#8345;&#8331;&#8321;{' '}
            converges to &phi;, the golden ratio.
          </p>
        </>
      }
    >
      <FibonacciDemo />
    </ExamplePage>
  );
}

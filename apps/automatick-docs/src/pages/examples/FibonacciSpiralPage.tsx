import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { FibonacciSpiralDemo } from '../../demos/FibonacciSpiralDemo';

export function FibonacciSpiralPage() {
  return (
    <ExamplePage
      title='Fibonacci spiral'
      description={
        <>
          <p>
            Golden spiral squares — ticks in a worker, canvas drawn on the main
            thread.
          </p>
          <p>
            Because the Fibonacci ratio converges to the golden ratio, the
            sequence is associated with spirals. We draw squares of Fibonacci
            side lengths, rotating direction each time, and link their corners
            to form a golden spiral.
          </p>
        </>
      }
    >
      <FibonacciSpiralDemo />
    </ExamplePage>
  );
}

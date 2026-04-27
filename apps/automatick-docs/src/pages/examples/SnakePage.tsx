import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { SnakeDemo } from '../../demos/SnakeDemo';

export function SnakePage() {
  return (
    <ExamplePage
      title='Snake'
      description={
        <>
          <p>
            Pathfinding snake that grows when it eats fruit. From the original
            automatick site; simulation runs in a worker, rendering uses{' '}
            <code>selectRenderState</code> on the main thread.
          </p>
          <p>
            This model tries to win the game of Snake. The snake moves on a
            grid, eating fruit to grow. If it can stay on a circuit covering
            the entire grid, it can loop endlessly and never collide. But
            that&apos;s slow — so the snake optimizes. When it eats a fruit, it
            finds the quickest route to the new fruit, then the longest route
            from the fruit back to its tail. If this forms a complete circuit,
            the snake updates its path.
          </p>
        </>
      }
    >
      <SnakeDemo />
    </ExamplePage>
  );
}

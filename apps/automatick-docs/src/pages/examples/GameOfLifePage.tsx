import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { GameOfLifeDemo } from '../../demos/GameOfLifeDemo';

export function GameOfLifePage() {
  return (
    <ExamplePage
      title='Game of Life'
      description={
        <p>
          Conway&apos;s Game of Life on a DOM grid — simulation runs on the
          main thread (<code>Simulation</code>).
        </p>
      }
    >
      <GameOfLifeDemo />
    </ExamplePage>
  );
}

import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { SimpleModelDemo } from '../../demos/SimpleModelDemo';

export function SimpleModelPage() {
  return (
    <ExamplePage
      title='Simple model'
      description={
        <>
          <p>
            A 10×10 grid that fills in tick order — minimal main-thread{' '}
            <code>Simulation</code> (from the old tutorial).
          </p>
          <p>
            This model shows how the parts of automatick work together. 100
            cells are arranged on a grid. A cell is filled if its number is
            less than the current tick. No initData or updateData needed — it
            works directly with the tick value.
          </p>
        </>
      }
    >
      <SimpleModelDemo />
    </ExamplePage>
  );
}

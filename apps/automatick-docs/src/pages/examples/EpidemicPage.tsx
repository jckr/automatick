import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { EpidemicDemo } from '../../demos/EpidemicDemo';

export function EpidemicPage() {
  return (
    <ExamplePage
      title='Epidemic'
      description={
        <>
          <p>
            <strong>Caveat:</strong> this model is just to show how simulations
            work. It has no scientific value.
          </p>
          <p>
            Inspired by Harry Stevens{"'"} work at the Washington Post, this
            epidemic simulator shows agents moving in a small space. When they
            collide, sick agents may contaminate healthy agents, and sick agents
            may die or recover.
          </p>
        </>
      }
    >
      <EpidemicDemo />
    </ExamplePage>
  );
}

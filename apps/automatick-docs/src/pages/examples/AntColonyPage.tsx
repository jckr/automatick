import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { AntColonyDemo } from '../../demos/AntColonyDemo';

export function AntColonyPage() {
  return (
    <ExamplePage
      title='Ant Colony'
      description={
        <>
          <p>
            Hundreds of ants wander from the nest, leaving a home-scented trail
            as they search. When one finds food, it carries a grain back while
            laying a food-scented trail &mdash; other ants follow the strongest
            scent, and over time trails converge on the richest sources.
            Pheromones decay each tick, so exhausted paths fade away on their
            own.
          </p>
          <p>
            This simulation mixes many agents with a dense 200&times;200
            pheromone grid &mdash; a hybrid data shape that stresses both
            snapshot size and per-tick compute.
          </p>
        </>
      }
    >
      <AntColonyDemo />
    </ExamplePage>
  );
}

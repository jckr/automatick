import React from 'react';
import { AntColonyDemo } from '../../demos/AntColonyDemo';

export function AntColonyPage() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Ant Colony</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        Hundreds of ants wander from the nest, leaving a home-scented trail as they
        search. When one finds food, it carries a grain back while laying a
        food-scented trail &mdash; other ants follow the strongest scent, and over
        time trails converge on the richest sources. Pheromones decay each tick, so
        exhausted paths fade away on their own.
      </p>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        This simulation mixes many agents with a dense 200&times;200 pheromone grid
        &mdash; a hybrid data shape that stresses both snapshot size and
        per-tick compute.
      </p>
      <AntColonyDemo />
    </div>
  );
}

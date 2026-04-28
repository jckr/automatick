import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { ChaosGameDemo } from '../../demos/ChaosGameDemo';

export function ChaosGamePage() {
  return (
    <ExamplePage
      title='Chaos game'
      description={
        <p>
          The Chaos Game generates a fractal. Starting from a polygon and a
          random point, each iteration plots a new point partway between the
          previous point and a randomly chosen vertex. With a triangle, this
          produces the Sierpi&#324;ski triangle. We can generalize to polygons
          with 3&ndash;12 vertices and toggle individual vertices as
          attractors. For larger polygons with all vertices active, the result
          looks messy &mdash; but selecting only a few vertices reveals
          striking patterns.
        </p>
      }
    >
      <ChaosGameDemo />
    </ExamplePage>
  );
}

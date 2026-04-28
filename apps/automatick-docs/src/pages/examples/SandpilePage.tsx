import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { SandpileDemo } from '../../demos/SandpileDemo';

export function SandpilePage() {
  return (
    <ExamplePage
      title='Abelian Sandpile'
      description={
        <p>
          Each tick drops grains of sand onto the center cell of a
          201&times;201 grid. Any cell holding four or more grains topples
          &mdash; shedding four grains, one to each of its four neighbors
          &mdash; which can set off long cascades. Per-tick cost is wildly
          variable: most ticks are trivial, a few are enormous &mdash; an ideal
          stress test for the PerformanceOverlay.
        </p>
      }
    >
      <SandpileDemo />
    </ExamplePage>
  );
}

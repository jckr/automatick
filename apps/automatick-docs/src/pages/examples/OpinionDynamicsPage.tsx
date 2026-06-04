import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { OpinionDynamicsDemo } from '../../demos/OpinionDynamicsDemo';

export function OpinionDynamicsPage() {
  return (
    <ExamplePage
      title='Opinion Dynamics'
      description={
        <>
          <p>
            A bounded-confidence model of how opinions spread. Each agent holds
            a continuous opinion between 0 (blue) and 1 (red). On every tick an
            agent averages the views of nearby agents — but only those whose
            opinion is within its <em>tolerance</em> — and nudges itself toward
            that average.
          </p>
          <p>
            The tolerance threshold decides everything. Set it high and the
            whole population converges to a single consensus; set it low and the
            crowd fragments into stubborn echo chambers that never reconcile.
            The chart tracks polarization and the number of distinct opinion
            clusters as they form.
          </p>
        </>
      }
    >
      <OpinionDynamicsDemo />
    </ExamplePage>
  );
}

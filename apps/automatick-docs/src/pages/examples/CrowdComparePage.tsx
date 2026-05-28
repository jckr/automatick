import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { CrowdCompareDemo } from '../../demos/CrowdCompareDemo';

export function CrowdComparePage() {
  return (
    <ExamplePage
      title='Crowd: Selfish vs Coordinated'
      description={
        <>
          <p>
            Two crowds, identical scenario and density, run side by side. On the
            left, every pedestrian is <strong>selfish</strong>: it goes as fast
            as it can toward its goal and shoves past everyone else (the
            social-force model from the crowd example). On the right, the crowd
            is <strong>coordinated</strong>: people follow assigned itineraries
            at a steady pace and never push — lanes are pre-assigned in the
            corridor, the bottleneck is fed by orderly queue-lanes, and the
            crossing runs on a traffic signal. The chart races their cumulative
            arrivals, so the steeper line is the more efficient regime.
          </p>
          <p>
            The result is not one-sided. Coordination wins decisively where
            there is a hard conflict — opposing lanes in the corridor, and the
            bottleneck, where selfish agents clog the gap while the scheduled
            crowd streams through. But at the open <strong>crossing</strong>,
            the fixed signal idles half the flow while selfish agents simply
            weave through each other, so reactivity is actually faster (until
            density gets high enough to gridlock). Efficiency depends on the
            geometry: schedules pay off exactly where free-for-all breaks down.
          </p>
        </>
      }
    >
      <CrowdCompareDemo />
    </ExamplePage>
  );
}

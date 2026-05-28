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
            Five layouts. Coordination wins decisively where there is a hard
            conflict — the <strong>corridor</strong> (opposing lanes), the{' '}
            <strong>bottleneck</strong>, the <strong>counterflow</strong> door
            (two directions through one gap, where selfish agents jam head-on
            and the scheduled crowd splits into one-way lanes — the biggest gap
            of all), and the <strong>four-way</strong> intersection. But at the
            open two-way <strong>crossing</strong>, the fixed signal idles half
            the flow while selfish agents simply weave through each other, so
            reactivity is actually faster — until density gets high enough to
            gridlock. Efficiency depends on the geometry: schedules pay off
            exactly where the free-for-all breaks down.
          </p>
          <p>
            In short: <strong>coordination wins wherever there is a hard
            conflict</strong> — doors, bottlenecks, counterflow — but{' '}
            <strong>reactive weaving beats a fixed schedule at an open
            crossing</strong>, until density rises enough to gridlock it.
          </p>
        </>
      }
    >
      <CrowdCompareDemo />
    </ExamplePage>
  );
}

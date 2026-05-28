import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { CrowdDemo } from '../../demos/CrowdDemo';

export function CrowdPage() {
  return (
    <ExamplePage
      title='Crowd Simulation'
      description={
        <>
          <p>
            Pedestrians steered by a social-force model (after Helbing): each
            person accelerates toward their goal direction while pushing gently
            away from neighbors and walls. No one is told to form a pattern —
            the collective behavior emerges from these local rules.
          </p>
          <p>
            Try the three scenarios. In the <strong>Corridor</strong>, two
            streams moving in opposite directions spontaneously sort into lanes.
            The <strong>Bottleneck</strong> funnels everyone through a narrow
            gap, producing queues and arching. The <strong>Crossing</strong>{' '}
            sends two flows through each other at right angles, where diagonal
            stripes appear. Widening <em>personal space</em> makes the crowd
            more congested — sometimes enough to jam.
          </p>
        </>
      }
    >
      <CrowdDemo />
    </ExamplePage>
  );
}

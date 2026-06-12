import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { PhysarumDemo } from '../../demos/PhysarumDemo';

export function PhysarumPage() {
  return (
    <ExamplePage
      title='Slime Mold (Physarum)'
      description={
        <>
          <p>
            Thousands of simple agents wander a chemical trail field. Each agent
            samples the trail at three sensors ahead of it, steers toward the
            strongest reading, moves forward, and deposits a little trail of its
            own. The trail then diffuses with a small box blur and decays over
            time.
          </p>
          <p>
            From these local rules, the colony self-organizes into the branching
            transport networks characteristic of <em>Physarum polycephalum</em>.
            The visualization shows the trail field itself, not the individual
            agents. Tweaking the sensor angle, sensor distance, and decay rate
            produces wildly different structures: tight meshes, flowing veins, or
            diffuse clouds.
          </p>
        </>
      }
    >
      <PhysarumDemo />
    </ExamplePage>
  );
}

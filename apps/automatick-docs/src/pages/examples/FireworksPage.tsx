import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { FireworksDemo } from '../../demos/FireworksDemo';

export function FireworksPage() {
  return (
    <ExamplePage
      title='Fireworks'
      description={
        <>
          <p>
            A classic particle-emitter system. Point sources along the bottom
            launch rockets upward; each rocket coasts under gravity and air
            drag, leaving a faint smoke trail, then bursts into a staged shell
            of colored sparks at its apex.
          </p>
          <p>
            Every particle has a finite lifetime and fades as it ages.
            Rendering accumulates with a semi-transparent overlay each frame
            instead of a hard clear, so the sparks leave glowing streaks.
          </p>
        </>
      }
    >
      <FireworksDemo />
    </ExamplePage>
  );
}

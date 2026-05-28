import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { PredatorPreyDemo } from '../../demos/PredatorPreyDemo';

export function PredatorPreyPage() {
  return (
    <ExamplePage
      title='Predator–Prey'
      description={
        <>
          <p>
            An agent-based take on the classic Lotka–Volterra dynamics. Green
            prey wander and reproduce; red predators hunt the nearest prey in
            range, gaining energy when they catch one and starving when they
            don{"'"}t. Well-fed predators split in two; hungry ones die.
          </p>
          <p>
            No equations are solved — the population oscillations emerge purely
            from individual encounters. Watch the chart: predator booms chase
            prey booms, then collapse as prey grow scarce, letting prey recover
            and the cycle repeat. Prey reproduction tapers near the carrying
            capacity, modelling limited grazing.
          </p>
        </>
      }
    >
      <PredatorPreyDemo />
    </ExamplePage>
  );
}

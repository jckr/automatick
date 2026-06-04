import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { ParticleLifeDemo } from '../../demos/ParticleLifeDemo';

export function ParticleLifePage() {
  return (
    <ExamplePage
      title='Particle Life'
      description={
        <>
          <p>
            Hundreds of particles, each belonging to one of several types, drift
            around under a single simple rule: a signed attraction matrix says
            how strongly every type is pulled toward (or pushed away from) every
            other type within a maximum radius. A universal short-range
            repulsion keeps particles from overlapping.
          </p>
          <p>
            There are no collisions and no goals — just forces and damping — yet
            the system spontaneously produces clusters, chasers, orbits, and
            cell-like structures. Flip{' '}
            <em>Randomize matrix</em> to reseed the force table and discover an
            entirely new ecosystem.
          </p>
        </>
      }
    >
      <ParticleLifeDemo />
    </ExamplePage>
  );
}

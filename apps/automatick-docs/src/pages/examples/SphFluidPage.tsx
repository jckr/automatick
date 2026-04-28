import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { SphFluidDemo } from '../../demos/SphFluidDemo';

export function SphFluidPage() {
  return (
    <ExamplePage
      title='SPH Fluid'
      description={
        <>
          <p>
            Weakly-compressible Smoothed Particle Hydrodynamics (M&uuml;ller
            2003) with a dam-break initial condition &mdash; a column of fluid
            collapses under gravity and sloshes around the domain. Each tick
            uses a spatial hash to find neighbors within the smoothing radius,
            then accumulates pressure and viscosity forces; still O(N&middot;k)
            per tick, heavy enough to stress the engine at a few thousand
            particles.
          </p>
          <p>
            Changing <strong>Particles</strong> takes effect after reset.
          </p>
        </>
      }
    >
      <SphFluidDemo />
    </ExamplePage>
  );
}

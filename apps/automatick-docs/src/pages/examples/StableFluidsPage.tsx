import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { StableFluidsDemo } from '../../demos/StableFluidsDemo';

export function StableFluidsPage() {
  return (
    <ExamplePage
      title='Stable Fluids'
      description={
        <p>
          Jos Stam&rsquo;s classic incompressible-fluid solver (GDC 2003) on a
          128&times;128 grid. Three emitters on independent orbits inject red,
          green, and blue dye into a shared velocity field; where plumes
          overlap they mix toward white. Each tick runs diffusion, advection,
          and Hodge projection &mdash; 20 Gauss-Seidel iterations per field,
          now five fields (velocity + three colors) per tick.
        </p>
      }
    >
      <StableFluidsDemo />
    </ExamplePage>
  );
}

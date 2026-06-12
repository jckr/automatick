import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { WaveDemo } from '../../demos/WaveDemo';

export function WavePage() {
  return (
    <ExamplePage
      title='Wave Propagation'
      description={
        <>
          <p>
            A field simulation of the 2D wave equation. Each cell tracks its
            current and previous height; the next height is computed from a
            discrete Laplacian of its neighbors using leapfrog integration, with
            a damping factor that bleeds energy out over time.
          </p>
          <p>
            One or more oscillating point sources continuously inject energy
            into the grid. With two or more sources, the overlapping ripples
            produce classic interference patterns. Tune the wave speed, damping,
            and source frequency to explore how the medium responds.
          </p>
        </>
      }
    >
      <WaveDemo />
    </ExamplePage>
  );
}

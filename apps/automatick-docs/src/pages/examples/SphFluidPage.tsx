import React from 'react';
import { SphFluidDemo } from '../../demos/SphFluidDemo';

export function SphFluidPage() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>SPH Fluid</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        Weakly-compressible Smoothed Particle Hydrodynamics (M&uuml;ller 2003)
        with a dam-break initial condition &mdash; a column of fluid collapses
        under gravity and sloshes around the domain. Each tick uses a spatial
        hash to find neighbors within the smoothing radius, then accumulates
        pressure and viscosity forces; still O(N&middot;k) per tick, heavy
        enough to stress the engine at a few thousand particles.
      </p>
      <p style={{ opacity: 0.75, lineHeight: 1.55, maxWidth: 720, fontSize: 14 }}>
        Changing <strong>Particles</strong> takes effect after reset.
      </p>
      <SphFluidDemo />
    </div>
  );
}

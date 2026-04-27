import React from 'react';
import { SandpileDemo } from '../../demos/SandpileDemo';

export function SandpilePage() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Abelian Sandpile</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        Each tick drops grains of sand onto the center cell of a 201&times;201
        grid. Any cell holding four or more grains topples &mdash; shedding four
        grains, one to each of its four neighbors &mdash; which can set off long
        cascades. Per-tick cost is wildly variable: most ticks are trivial, a
        few are enormous &mdash; an ideal stress test for the
        PerformanceOverlay.
      </p>
      <SandpileDemo />
    </div>
  );
}

import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { WorldSpinnerDemo } from '../../demos/WorldSpinnerDemo';

export function WorldSpinnerPage() {
  return (
    <ExamplePage
      title='World spinner'
      description={
        <>
          <p>
            A 3D globe pointed at by a Fibonacci-spiral lattice of dots, with
            highlighted anchors at major cities pulsing on a Poisson-style
            schedule. Rotation is driven by a single number — the camera
            angle — that lives in <code>Data</code>; pulses are appended and
            decayed by <code>step</code>.
          </p>
          <p>
            What's instructive here is what's <strong>not</strong> in{' '}
            <code>Data</code>: the dot lattice itself. It's a module-level
            constant in <code>worldSpinnerData.ts</code>, computed once at
            load time from a Fibonacci spiral, and consumed directly by the
            renderer. <code>step</code> never sees it. <code>Data</code> only
            carries the things that actually change every tick — the angle
            and the active pulses — which is what makes a "view animates,
            data is mostly static" sim ergonomic with automatick's existing
            primitives. The discipline scales: a 100MB dataset is just a
            larger module-level constant, or a worker-side derivation whose
            output rolled-up summary is what gets posted back through the
            engine.
          </p>
          <p>
            Rendered with <code>three.js</code> via{' '}
            <code>@react-three/fiber</code> — both are{' '}
            <em>docs-app</em> dependencies, never bundled into{' '}
            <code>automatick</code> itself.
          </p>
        </>
      }
    >
      <WorldSpinnerDemo />
    </ExamplePage>
  );
}

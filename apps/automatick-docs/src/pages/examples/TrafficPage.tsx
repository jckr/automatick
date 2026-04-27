import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { TrafficDemo } from '../../demos/TrafficDemo';

export function TrafficPage() {
  return (
    <ExamplePage
      title='Traffic (Nagel-Schreckenberg)'
      description={
        <>
          <p>
            A cellular-automaton traffic model on a 4-lane circular road with
            1000 cells per lane. Each car accelerates toward <code>vMax</code>,
            brakes to avoid the car ahead, then randomly slows with probability{' '}
            <code>pSlow</code> &mdash; that one random-brake step is what
            breaks platoons and lets jams nucleate spontaneously. Push{' '}
            <code>density</code> past ~0.3 and watch shockwaves ripple backward
            against the flow.
          </p>
          <p>
            Density changes only take effect on reset (cars can&apos;t be added
            or removed mid-run without corrupting the lattice). Color encodes
            velocity: blue = stopped, yellow = cruising, red = at{' '}
            <code>vMax</code>.
          </p>
        </>
      }
    >
      <TrafficDemo />
    </ExamplePage>
  );
}

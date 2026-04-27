import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { WorkerCanvasDemo } from '../../demos/WorkerCanvasDemo';

export function WorkerCanvasPage() {
  return (
    <ExamplePage
      title='Worker canvas'
      description={
        <>
          <p>
            OffscreenCanvas rendering + tick updates happen in a worker; the
            main thread only sends controls.
          </p>
          <p>
            An XOR ring automaton rendered as accumulated rows on canvas. Each
            row is computed from the previous using XOR with neighbors,
            producing fractal-like patterns.
          </p>
        </>
      }
    >
      <WorkerCanvasDemo />
    </ExamplePage>
  );
}

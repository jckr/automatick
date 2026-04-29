import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { AutomatickBubblesDemo } from '../../demos/AutomatickBubblesDemo';

export function AutomatickBubblesPage() {
  return (
    <ExamplePage
      title='automatick — bubbles'
      description={
        <>
          <p>
            Bubbles drift left to right across the canvas. When a bubble's
            center is inside the silhouette of "automatick", it slows to a
            small fraction of its base speed and gets tinted. Bubbles that
            exit stage right respawn at stage left. The wordmark is{' '}
            <strong>never drawn explicitly</strong>: it emerges from (a)
            the higher density of bubbles inside the letters caused by the
            slowdown plus conservation-of-flow, and (b) the per-bubble color
            tint applied while inside.
          </p>
          <p>
            Render is a metaball iso-contour: each bubble contributes a
            Wyvill kernel <code>(1 − (d/R)²)³</code> to a scalar field
            sampled on a half-resolution grid. Pixels where the field
            exceeds the threshold are painted; close bubbles' fields merge
            and bridges form between them organically. Color at each pixel
            is the kernel-weighted average of the contributing bubbles'
            colors — so a bridge spanning the wordmark edge is a smooth
            gradient between accent and neutral.
          </p>
        </>
      }
    >
      <AutomatickBubblesDemo />
    </ExamplePage>
  );
}

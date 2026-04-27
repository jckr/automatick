import React from 'react';
import { GrayScottDemo } from '../../demos/GrayScottDemo';

export function GrayScottPage() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Gray-Scott Reaction-Diffusion</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        A partial-differential-equation simulation on a 200&times;200 grid. Each
        tick runs <code>subTicks</code> inner sub-steps, and every sub-step
        applies a five-point Laplacian stencil to two concentration fields
        (<em>u</em> and <em>v</em>) &mdash; that&apos;s 2 &times; subTicks
        &times; 40,000 stencil updates per engine tick, which genuinely
        stresses the engine.
      </p>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        Tweaking the feed rate <em>F</em> and kill rate <em>k</em> produces
        strikingly different patterns &mdash; spots, stripes, solitons, or
        waves &mdash; all from the same local rule.
      </p>
      <GrayScottDemo />
    </div>
  );
}

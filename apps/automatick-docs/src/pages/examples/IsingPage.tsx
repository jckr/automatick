import React from 'react';
import { IsingDemo } from '../../demos/IsingDemo';

export function IsingPage() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Ising Model</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        A toy model of a magnet. Every cell in the 200&times;200 grid is a tiny
        magnet pointing either up (cream) or down (blue). Each cell &ldquo;wants&rdquo;
        to align with its 4 neighbors &mdash; flipping to match them lowers energy,
        flipping against them costs energy. Temperature fights that preference:
        the higher it is, the more often cells flip randomly against their
        neighbors.
      </p>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        Each tick, we pick random cells one at a time and ask &ldquo;should this
        flip?&rdquo; &mdash; if flipping lowers energy we always do it; otherwise
        we flip with probability <code>exp(-&Delta;E / T)</code>. That&apos;s the
        Metropolis rule. Drag the <strong>temperature</strong> slider:
      </p>
      <ul style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        <li><strong>Low T (below ~2.27):</strong> neighbors dominate; the grid
          freezes into one big color with ragged islands of the other.</li>
        <li><strong>High T (above ~2.27):</strong> randomness wins; the grid
          looks like static.</li>
        <li><strong>Near T<sub>c</sub> &asymp; 2.269:</strong> the critical
          point &mdash; patterns of every size coexist, producing the famous
          fractal, scale-invariant domains.</li>
      </ul>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        The <em>magnetization</em> readout above the canvas is the average spin
        (+1 all-cream, &minus;1 all-blue, 0 balanced). The{' '}
        <strong>external field</strong> nudges the whole lattice toward one
        color &mdash; like holding a real magnet nearby.{' '}
        <strong>Sweeps per tick</strong> controls how much work happens between
        renders: each sweep is 200&sup2; = 40,000 flip attempts, so cranking it
        up is what stresses the engine.
      </p>
      <IsingDemo />
    </div>
  );
}

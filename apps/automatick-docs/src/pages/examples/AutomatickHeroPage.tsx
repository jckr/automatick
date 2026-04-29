import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { AutomatickHeroDemo } from '../../demos/AutomatickHeroDemo';

export function AutomatickHeroPage() {
  return (
    <ExamplePage
      title='automatick — letter form'
      description={
        <>
          <p>
            A visualization-first simulation. Nodes drift around the canvas
            with a fixed speed and wrap at the edges. <strong>Every tick, the
            link set is re-evaluated from scratch.</strong> For each pair
            within <code>linkDistance</code> of each other, the simulation
            rolls a probability: <code>p</code> if at least one endpoint is
            outside the silhouette of "automatick", or the much higher{' '}
            <code>q</code> if both endpoints are inside. Links don't persist
            — the visible logo is the steady-state density of these per-tick
            rolls.
          </p>
          <p>
            The demo shows the central discipline of visualization-first sims
            in automatick: <strong>only animated state lives in{' '}
            <code>Data</code></strong>. The letter mask itself — a{' '}
            <code>Uint8Array</code> bitmap built once from a rasterized word
            — sits as a memoized module-level constant, never round-tripping
            through the engine. <code>Data</code> only carries the things
            that actually change every tick: node positions and the link
            roll-out for that tick.
          </p>
          <p>
            Try setting <code>Q</code> close to <code>P</code> — the word
            disappears into noise. Drop <code>Q</code> to zero — the letter
            shape becomes a hole instead of a glow.
          </p>
        </>
      }
    >
      <AutomatickHeroDemo />
    </ExamplePage>
  );
}

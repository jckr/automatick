import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { PercolationDemo } from '../../demos/PercolationDemo';
import { PercolationGridDemo } from '../../demos/PercolationGridDemo';

const intro: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 22,
  lineHeight: 1.35,
  color: 'var(--fg1)',
  maxWidth: '60ch',
  margin: '0 0 24px',
  fontVariationSettings: '"opsz" 22',
};

const bridge: React.CSSProperties = {
  maxWidth: '68ch',
  margin: '32px 0 24px',
  fontSize: 15,
  lineHeight: 1.65,
};

export function PercolationPage() {
  return (
    <ExamplePage title='Percolation'>
      <p style={intro}>
        A 2D lattice of cells which either let liquid through or block it.
        Pour liquid in at the top — does any of it reach the bottom? It
        depends on the porosity, the share of cells that are open.
      </p>

      <PercolationDemo />

      <p style={bridge}>
        One run is just one outcome. The interesting behaviour is that the
        chance of percolation doesn&apos;t scale linearly with porosity:
        below a{' '}
        <a href='https://en.wikipedia.org/wiki/Percolation_threshold'>
          threshold
        </a>{' '}
        (about <em>0.59</em> for a 4-neighbour 2D lattice) liquid almost
        never gets through; above it, it almost always does. To see that,
        we run the same simulation many times across a sweep of porosities.
      </p>

      <PercolationGridDemo />

      <p style={{ ...bridge, margin: '32px 0 0' }}>
        Each column above sweeps porosity left to right with{' '}
        <strong>10 independent runs</strong>; the bar under each column
        counts how many of those 10 percolated. The transition between
        &ldquo;rare&rdquo; and &ldquo;almost always&rdquo; is sharp and sits
        right around the predicted threshold.
      </p>
    </ExamplePage>
  );
}

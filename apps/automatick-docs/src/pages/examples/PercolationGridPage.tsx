import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { PercolationGridDemo } from '../../demos/PercolationGridDemo';

export function PercolationGridPage() {
  return (
    <ExamplePage
      title='Percolation grid'
      description={
        <>
          <p>
            The single-instance percolation example shows one outcome at one
            porosity. The interesting behaviour shows up across many runs:
            below a threshold (about <em>0.59</em> for a 4-neighbour 2D
            lattice) liquid almost never percolates; above it, it almost
            always does.
          </p>
          <p>
            Each column below sweeps porosity left to right; each column has{' '}
            <strong>10 independent runs</strong>. The strip under each column
            counts how many of those 10 percolated. The transition between
            &ldquo;rarely&rdquo; and &ldquo;almost always&rdquo; is sharp and
            sits right around the predicted threshold.
          </p>
        </>
      }
    >
      <PercolationGridDemo />
    </ExamplePage>
  );
}

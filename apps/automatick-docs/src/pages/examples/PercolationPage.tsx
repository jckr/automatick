import React from 'react';
import { Link } from 'react-router-dom';
import { ExamplePage } from '../../layout/ExamplePage';
import { PercolationDemo } from '../../demos/PercolationDemo';

export function PercolationPage() {
  return (
    <ExamplePage
      title='Percolation'
      description={
        <>
          <p>
            A 2D lattice is made of cells which either let liquid go through
            (porous) or not. If we pour liquid on the top of the lattice, will
            any of it go through? This depends on the porosity of the lattice
            &mdash; the percentage of cells which are porous.
          </p>
          <p>
            Interestingly, the chances of liquid getting through don&apos;t
            vary linearly with the porosity. Below a certain{' '}
            <a href='https://en.wikipedia.org/wiki/Percolation_threshold'>
              threshold
            </a>{' '}
            (around <em>0.59</em> for a 2D lattice), percolation is very
            unlikely; above it, it becomes very likely. To see the threshold
            transition show up across many runs, see{' '}
            <Link to='/examples/percolation-grid'>Percolation grid</Link>.
          </p>
        </>
      }
    >
      <PercolationDemo />
    </ExamplePage>
  );
}

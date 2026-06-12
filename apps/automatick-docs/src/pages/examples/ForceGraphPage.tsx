import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { ForceGraphDemo } from '../../demos/ForceGraphDemo';

export function ForceGraphPage() {
  return (
    <ExamplePage
      title='Force-Directed Graph'
      description={
        <>
          <p>
            A force-directed layout untangles a graph by treating it as a
            physical system. Every node repels every other node with a
            Coulomb-like inverse-square force, while edges act as springs
            pulling connected nodes toward an ideal distance. Velocity damping
            and a gentle centering gravity let the whole structure settle into a
            readable arrangement.
          </p>
          <p>
            The settling process is the animation: a tangled initial graph
            spreads out and reveals its structure. The clusters preset is the
            best showcase, with community structure becoming visually obvious as
            the layout converges. Node size reflects degree and color reflects
            cluster membership.
          </p>
        </>
      }
    >
      <ForceGraphDemo />
    </ExamplePage>
  );
}

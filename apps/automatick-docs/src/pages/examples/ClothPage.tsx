import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { ClothDemo } from '../../demos/ClothDemo';

export function ClothPage() {
  return (
    <ExamplePage
      title='Rope / Cloth'
      description={
        <>
          <p>
            A position-based physics simulation built on Verlet integration.
            Each point stores its current and previous position; velocity is
            implicit in the difference between them. Gravity pulls the points
            down, and distance constraints between neighbours are relaxed over
            several iterations per tick to hold the structure together.
          </p>
          <p>
            More constraint iterations make the fabric stiffer. The top row is
            pinned, so the cloth sags and swings naturally. Switch to the rope
            preset for a single hanging chain, or raise the tear threshold to
            let constraints snap when stretched too far.
          </p>
        </>
      }
    >
      <ClothDemo />
    </ExamplePage>
  );
}

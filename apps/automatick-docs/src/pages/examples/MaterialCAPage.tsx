import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { MaterialCADemo } from '../../demos/MaterialCADemo';

export function MaterialCAPage() {
  return (
    <ExamplePage
      title='Water / Fire / Smoke'
      description={
        <>
          <p>
            A cellular-physics sandbox where each grid cell holds a material:
            sand and water fall and settle, water flows sideways to fill
            containers, fire climbs and spreads to flammable wood before dying
            out into smoke, and smoke drifts upward and slowly dissipates.
          </p>
          <p>
            Materials interact: water extinguishes nearby fire, sand sinks
            through water, and burning wood feeds the flames. Pick a material
            from the brush controls and paint directly on the canvas to set the
            scene alight.
          </p>
        </>
      }
    >
      <MaterialCADemo />
    </ExamplePage>
  );
}

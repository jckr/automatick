import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { TerrainDemo } from '../../demos/TerrainDemo';

export function TerrainPage() {
  return (
    <ExamplePage
      title='Terrain Generation'
      description={
        <>
          <p>
            The landscape starts as a fractal value-noise heightmap — several
            octaves of smooth noise summed at decreasing amplitude to produce
            mountains, valleys, and coastlines. A biome colormap maps elevation
            and moisture to deep water, shore, grassland, forest, rock, and snow,
            with hillshading from the height gradient for relief.
          </p>
          <p>
            Each tick the terrain evolves: hydraulic erosion sends rain droplets
            flowing downhill, carving valleys and depositing sediment, while
            thermal erosion smooths slopes steeper than the talus angle. Carved
            riverbeds and softened ridges emerge over time. Reseed for a fresh
            world, or adjust the rain and erosion rates to change how it weathers.
          </p>
        </>
      }
    >
      <TerrainDemo />
    </ExamplePage>
  );
}

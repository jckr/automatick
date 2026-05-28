import { ExamplePage } from '../../layout/ExamplePage';
import { ErosionDemo } from '../../demos/ErosionDemo';

export function ErosionPage() {
  return (
    <ExamplePage
      title='Hydraulic Erosion'
      description={
        <>
          <p>
            A noise-generated heightmap is sculpted by simulated rainfall. Each
            tick spawns hundreds of water droplets at random points; every
            droplet rolls downhill following the local gradient, picking up
            sediment where it moves fast on steep ground and dropping it where
            it slows in flatter terrain.
          </p>
          <p>
            Over time the droplets carve branching river valleys, sharpen
            ridgelines, and build up sediment fans &mdash; all from a single
            local rule applied to thousands of particles. Terrain is shaded by
            slope (hillshading) and elevation, with recent droplet paths tinted
            blue to reveal the drainage network.
          </p>
        </>
      }
    >
      <ErosionDemo />
    </ExamplePage>
  );
}

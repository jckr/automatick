import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import terrainSim from '../sims/terrainSim';
import styles from './TerrainDemo.module.css';

const CSS_SIZE = 600;

// Biome coloring from elevation + moisture. Returns [r, g, b].
function biomeColor(
  h: number,
  moisture: number,
  seaLevel: number,
): [number, number, number] {
  if (h < seaLevel) {
    // Water: deep navy → shallow teal as it approaches the shore.
    const t = h / seaLevel;
    return [20 + t * 30, 50 + t * 90, 90 + t * 110];
  }
  // Normalize land elevation to [0, 1] above sea level.
  const e = (h - seaLevel) / (1 - seaLevel || 1);

  if (e < 0.05) {
    // Beach / shore.
    return [210, 200, 150];
  }
  if (e < 0.4) {
    // Lowland: forest (wet) → grassland (dry).
    const wet = moisture;
    const r = 90 + (1 - wet) * 70;
    const g = 130 + wet * 30;
    const b = 60 + (1 - wet) * 20;
    return [r, g, b];
  }
  if (e < 0.7) {
    // Hills: tan / brown.
    const t = (e - 0.4) / 0.3;
    return [150 - t * 30, 130 - t * 30, 90 - t * 20];
  }
  if (e < 0.88) {
    // Rocky.
    const t = (e - 0.7) / 0.18;
    return [110 + t * 40, 105 + t * 40, 100 + t * 40];
  }
  // Snow peaks.
  const t = (e - 0.88) / 0.12;
  return [220 + t * 35, 225 + t * 30, 235 + t * 20];
}

function TerrainCanvas() {
  const canvasRef = useSimulationCanvas<typeof terrainSim>(
    (ctx, { data, params }, view) => {
      const { heightmap, moisture, water, size } = data;
      const seaLevel = params.seaLevel;

      // Light direction (top-left) for hillshading.
      const lx = -0.5;
      const ly = -0.5;
      const lz = 0.7;

      // The shaded heightmap is a per-cell RGBA field, so blitGrid scales it
      // up with crisp nearest-neighbor — matching the original (which already
      // drew with imageSmoothingEnabled = false).
      view.blitGrid(size, size, (px) => {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const i = y * size + x;
            const h = heightmap[i];

            let [r, g, b] = biomeColor(h, moisture[i], seaLevel);

            if (h >= seaLevel) {
              // Hillshade land from height gradient.
              const xL = x > 0 ? heightmap[i - 1] : h;
              const xR = x < size - 1 ? heightmap[i + 1] : h;
              const yU = y > 0 ? heightmap[i - size] : h;
              const yD = y < size - 1 ? heightmap[i + size] : h;
              const nx = (xL - xR) * 4;
              const ny = (yU - yD) * 4;
              const nz = 1;
              const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);
              let shade = (nx * lx + ny * ly + nz * lz) / nlen;
              shade = 0.65 + shade * 0.5;
              shade = Math.max(0.35, Math.min(1.25, shade));
              r *= shade;
              g *= shade;
              b *= shade;
            }

            // River overlay where droplets recently flowed (above sea level).
            const w = water[i];
            if (h >= seaLevel && w > 0.6) {
              const wf = Math.min(w / 6, 0.6);
              r = r * (1 - wf) + 40 * wf;
              g = g * (1 - wf) + 100 * wf;
              b = b * (1 - wf) + 200 * wf;
            }

            const j = i * 4;
            px[j] = Math.max(0, Math.min(255, r));
            px[j + 1] = Math.max(0, Math.min(255, g));
            px[j + 2] = Math.max(0, Math.min(255, b));
            px[j + 3] = 255;
          }
        }
      });
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

// A genuinely fresh terrain needs a fresh seed, but the engine fixes its seed
// at construction and `resetWith()` replays that same seed. So "Reseed" remounts
// the whole <Simulation> (via the `key` bumped in TerrainDemo), which records a
// new random seed and builds an unrelated landscape.
function ReseedButton({ onReseed }: { onReseed: () => void }) {
  return (
    <div className='group'>
      <button
        type='button'
        className='chip'
        style={{ width: '100%' }}
        onClick={onReseed}
      >
        Reseed terrain
      </button>
    </div>
  );
}

// Terrain-shape params (scale/detail) only take effect when the heightmap is
// rebuilt, so reset on change. `resetWith()` reruns init with the new params on
// the same seed, yielding a coherent new shape without disturbing the run's
// reproducibility.
function ResetOnTerrainChange({ children }: { children: React.ReactNode }) {
  const { params, resetWith } = useSimulation<typeof terrainSim>();
  const lastRef = React.useRef<string>('');
  const key = `${params.noiseScale}|${params.noiseOctaves}`;
  React.useEffect(() => {
    if (lastRef.current && lastRef.current !== key) {
      resetWith();
    }
    lastRef.current = key;
  }, [key, resetWith]);
  return <>{children}</>;
}

const TERRAIN_GROUPS: DemoControlGroup[] = [
  {
    label: 'Terrain (resets)',
    controls: [
      { type: 'range', param: 'noiseScale', label: 'Scale', min: 2, max: 8, step: 1 },
      { type: 'range', param: 'noiseOctaves', label: 'Detail', min: 1, max: 7, step: 1 },
      { type: 'range', param: 'seaLevel', label: 'Sea level', min: 0, max: 0.6, step: 0.02 },
    ],
  },
  {
    label: 'Evolution',
    controls: [
      { type: 'range', param: 'evolutionSpeed', label: 'Speed', min: 1, max: 5, step: 1 },
      { type: 'range', param: 'dropsPerTick', label: 'Rain', min: 20, max: 400, step: 20 },
      {
        type: 'range',
        param: 'erosionRate',
        label: 'Erosion rate',
        min: 0.05,
        max: 0.6,
        step: 0.05,
      },
      {
        type: 'range',
        param: 'thermalErosionRate',
        label: 'Thermal erosion',
        min: 0,
        max: 0.1,
        step: 0.01,
      },
    ],
  },
];

export function TerrainDemo() {
  // Remount key: bumping it gives the sim a fresh recorded seed (new terrain).
  const [seedKey, setSeedKey] = React.useState(0);
  return (
    <Simulation key={seedKey} sim={terrainSim} pauseWhenHidden delayMs={0} autoplay>
      <ResetOnTerrainChange>
        <DemoSplit
          preview={<TerrainCanvas />}
          controls={
            <DemoControlPanel
              groups={TERRAIN_GROUPS}
              extra={<ReseedButton onReseed={() => setSeedKey((k) => k + 1)} />}
              showStep
            />
          }
        />
      </ResetOnTerrainChange>
    </Simulation>
  );
}

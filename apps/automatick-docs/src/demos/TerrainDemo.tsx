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
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof terrainSim>(
    (ctx, { data, params }) => {
      const { heightmap, moisture, water, size } = data;
      const seaLevel = params.seaLevel;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!offscreenRef.current) {
        const off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        offscreenRef.current = off;
      }
      const off = offscreenRef.current;
      const offCtx = off.getContext('2d');
      if (!offCtx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        return;
      }
      if (
        !imageDataRef.current ||
        imageDataRef.current.width !== size ||
        imageDataRef.current.height !== size
      ) {
        imageDataRef.current = offCtx.createImageData(size, size);
      }
      const imageData = imageDataRef.current;
      const px = imageData.data;

      // Light direction (top-left) for hillshading.
      const lx = -0.5;
      const ly = -0.5;
      const lz = 0.7;

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

      offCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, CSS_SIZE, CSS_SIZE);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  );

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas
        ref={canvasRef}
        width={CSS_SIZE * dpr}
        height={CSS_SIZE * dpr}
        className={styles.canvas}
      />
    </CanvasStage>
  );
}

function ReseedButton() {
  const { resetWith } = useSimulation<typeof terrainSim>();
  return (
    <div className='group'>
      <button
        type='button'
        className='chip'
        style={{ width: '100%' }}
        onClick={() => resetWith({ seed: Math.floor(Math.random() * 1e9) })}
      >
        Reseed terrain
      </button>
    </div>
  );
}

// Terrain-shape params require rebuilding the heightmap, so reset on change.
function ResetOnTerrainChange({ children }: { children: React.ReactNode }) {
  const { params, resetWith } = useSimulation<typeof terrainSim>();
  const lastRef = React.useRef<string>('');
  const key = `${params.noiseScale}|${params.noiseOctaves}`;
  React.useEffect(() => {
    if (lastRef.current && lastRef.current !== key) {
      resetWith({ seed: Math.floor(Math.random() * 1e9) });
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
  return (
    <Simulation sim={terrainSim} delayMs={0} autoplay>
      <ResetOnTerrainChange>
        <DemoSplit
          preview={<TerrainCanvas />}
          controls={
            <DemoControlPanel
              groups={TERRAIN_GROUPS}
              extra={<ReseedButton />}
              showStep
            />
          }
        />
      </ResetOnTerrainChange>
    </Simulation>
  );
}

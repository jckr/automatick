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
import erosionSim, { ERO_SIZE } from '../sims/erosionSim';
import styles from './ErosionDemo.module.css';

const CSS_SIZE = 600;

// Elevation color ramp: low (dark green) → mid (tan) → high (gray/white).
function terrainColor(h: number): [number, number, number] {
  if (h < 0.35) {
    const t = h / 0.35;
    return [40 + t * 30, 80 + t * 40, 40 + t * 20];
  }
  if (h < 0.65) {
    const t = (h - 0.35) / 0.3;
    return [70 + t * 80, 120 + t * 40, 60 + t * 30];
  }
  if (h < 0.85) {
    const t = (h - 0.65) / 0.2;
    return [150 + t * 40, 160 - t * 10, 90 + t * 20];
  }
  const t = (h - 0.85) / 0.15;
  return [190 + t * 55, 150 + t * 90, 110 + t * 130];
}

function ErosionCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof erosionSim>((ctx, { data }) => {
    const { heightmap, water, size } = data;
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
    if (!imageDataRef.current) {
      imageDataRef.current = offCtx.createImageData(size, size);
    }
    const imageData = imageDataRef.current;
    const px = imageData.data;

    // Light direction for hillshading (top-left).
    const lx = -0.5;
    const ly = -0.5;
    const lz = 0.7;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const h = heightmap[i];

        // Surface normal from height gradient.
        const xL = x > 0 ? heightmap[i - 1] : h;
        const xR = x < size - 1 ? heightmap[i + 1] : h;
        const yU = y > 0 ? heightmap[i - size] : h;
        const yD = y < size - 1 ? heightmap[i + size] : h;
        const nx = (xL - xR) * 4;
        const ny = (yU - yD) * 4;
        const nz = 1;
        const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);
        let shade = (nx * lx + ny * ly + nz * lz) / nlen;
        shade = 0.6 + shade * 0.5;
        shade = Math.max(0.3, Math.min(1.25, shade));

        let [r, g, b] = terrainColor(h);
        r *= shade;
        g *= shade;
        b *= shade;

        // Water overlay where droplets recently flowed.
        const w = water[i];
        if (w > 0.4) {
          const wf = Math.min(w / 6, 0.7);
          r = r * (1 - wf) + 40 * wf;
          g = g * (1 - wf) + 90 * wf;
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
  });

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

function NewTerrainButton() {
  const { resetWith, params } = useSimulation<typeof erosionSim>();
  return (
    <div className='group'>
      <button
        type='button'
        className='chip'
        style={{ width: '100%' }}
        onClick={() => resetWith({ seed: Math.floor(Math.random() * 1e9) })}
      >
        New terrain
      </button>
    </div>
  );
}

const EROSION_GROUPS: DemoControlGroup[] = [
  {
    label: 'Terrain (resets)',
    controls: [
      {
        type: 'range',
        param: 'noiseScale',
        label: 'Scale',
        min: 2,
        max: 8,
        step: 1,
      },
      {
        type: 'range',
        param: 'noiseOctaves',
        label: 'Detail',
        min: 1,
        max: 7,
        step: 1,
      },
    ],
  },
  {
    label: 'Erosion',
    controls: [
      {
        type: 'range',
        param: 'dropsPerTick',
        label: 'Rain',
        min: 20,
        max: 400,
        step: 20,
      },
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
        param: 'depositionRate',
        label: 'Deposition rate',
        min: 0.05,
        max: 0.6,
        step: 0.05,
      },
      {
        type: 'range',
        param: 'evaporation',
        label: 'Evaporation',
        min: 0.005,
        max: 0.08,
        step: 0.005,
      },
    ],
  },
];

export function ErosionDemo() {
  return (
    <Simulation sim={erosionSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<ErosionCanvas />}
        controls={
          <DemoControlPanel
            groups={EROSION_GROUPS}
            extra={<NewTerrainButton />}
            showStep
          />
        }
      />
    </Simulation>
  );
}

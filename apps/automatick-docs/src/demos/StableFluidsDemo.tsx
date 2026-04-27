import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import stableFluidsSim, { GRID_N } from '../sims/stableFluidsSim';

const WIDTH = 600;
const HEIGHT = 600;

function StableFluidsCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof stableFluidsSim>((ctx, { data }) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const N = GRID_N;

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = N;
      off.height = N;
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
      imageDataRef.current.width !== N ||
      imageDataRef.current.height !== N
    ) {
      imageDataRef.current = offCtx.createImageData(N, N);
    }
    const imageData = imageDataRef.current;
    const px = imageData.data;
    const { densR, densG, densB } = data;
    const stride = N + 2;

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const src = i + 1 + (j + 1) * stride;
        const tr = 1 - Math.exp(-densR[src] * 0.12);
        const tg = 1 - Math.exp(-densG[src] * 0.12);
        const tb = 1 - Math.exp(-densB[src] * 0.12);
        const k = (i + j * N) * 4;
        px[k] = Math.floor(tr * 255);
        px[k + 1] = Math.floor(tg * 255);
        px[k + 2] = Math.floor(tb * 255);
        px[k + 3] = 255;
      }
    }
    offCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, WIDTH, HEIGHT);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas
        ref={canvasRef}
        width={WIDTH * dpr}
        height={HEIGHT * dpr}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
      />
    </CanvasStage>
  );
}

const FLUID_GROUPS: DemoControlGroup[] = [
  {
    label: 'Solver',
    controls: [
      {
        type: 'range',
        param: 'visc',
        label: 'Viscosity',
        min: 0,
        max: 0.0001,
        step: 0.00001,
      },
      {
        type: 'range',
        param: 'diff',
        label: 'Diffusion',
        min: 0,
        max: 0.0001,
        step: 0.00001,
      },
      {
        type: 'range',
        param: 'dt',
        label: 'Timestep',
        min: 0.05,
        max: 0.3,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'forceStrength',
        label: 'Force',
        min: 10,
        max: 80,
        step: 5,
      },
      {
        type: 'range',
        param: 'dissipation',
        label: 'Dissipation',
        min: 0,
        max: 3,
        step: 0.1,
      },
    ],
  },
  {
    label: 'Red emitter',
    controls: [
      {
        type: 'range',
        param: 'radiusR',
        label: 'Radius',
        min: 5,
        max: 55,
        step: 1,
      },
      {
        type: 'range',
        param: 'speedR',
        label: 'Speed',
        min: -0.1,
        max: 0.1,
        step: 0.005,
      },
    ],
  },
  {
    label: 'Green emitter',
    controls: [
      {
        type: 'range',
        param: 'radiusG',
        label: 'Radius',
        min: 5,
        max: 55,
        step: 1,
      },
      {
        type: 'range',
        param: 'speedG',
        label: 'Speed',
        min: -0.1,
        max: 0.1,
        step: 0.005,
      },
    ],
  },
  {
    label: 'Blue emitter',
    controls: [
      {
        type: 'range',
        param: 'radiusB',
        label: 'Radius',
        min: 5,
        max: 55,
        step: 1,
      },
      {
        type: 'range',
        param: 'speedB',
        label: 'Speed',
        min: -0.1,
        max: 0.1,
        step: 0.005,
      },
    ],
  },
];

export function StableFluidsDemo() {
  return (
    <Simulation sim={stableFluidsSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<StableFluidsCanvas />}
        controls={<DemoControlPanel groups={FLUID_GROUPS} showStep />}
      />
    </Simulation>
  );
}

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
import isingSim from '../sims/isingSim';

const GRID = 200;
const CSS_SIZE = 600;

function IsingCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof isingSim>((ctx, { data }) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = GRID;
      off.height = GRID;
      offscreenRef.current = off;
    }
    const off = offscreenRef.current;
    const offCtx = off.getContext('2d');
    if (!offCtx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }
    if (!imageDataRef.current) {
      imageDataRef.current = offCtx.createImageData(GRID, GRID);
    }
    const imageData = imageDataRef.current;
    const px = imageData.data;

    for (let i = 0; i < GRID * GRID; i++) {
      const s = data.spins[i];
      const j = i * 4;
      if (s > 0) {
        px[j] = 240;
        px[j + 1] = 230;
        px[j + 2] = 210;
      } else {
        px[j] = 25;
        px[j + 1] = 35;
        px[j + 2] = 70;
      }
      px[j + 3] = 255;
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
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
      />
    </CanvasStage>
  );
}

function IsingStats() {
  const { data } = useSimulation<typeof isingSim>();
  return (
    <div className='group'>
      <div className='g-lbl'>Readouts</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--fg3)' }}>magnetization</span>
          <span style={{ color: 'var(--fg1)' }}>{data.magnetization.toFixed(3)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--fg3)' }}>energy</span>
          <span style={{ color: 'var(--fg1)' }}>{data.energy.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

const ISING_GROUPS: DemoControlGroup[] = [
  {
    label: 'Field',
    controls: [
      {
        type: 'range',
        param: 'T',
        label: 'Temperature',
        min: 0.5,
        max: 5,
        step: 0.05,
      },
      {
        type: 'range',
        param: 'externalField',
        label: 'External field',
        min: -1,
        max: 1,
        step: 0.05,
      },
    ],
  },
  {
    label: 'Compute',
    controls: [
      {
        type: 'range',
        param: 'sweepsPerTick',
        label: 'Sweeps / tick',
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
];

export function IsingDemo() {
  return (
    <Simulation sim={isingSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<IsingCanvas />}
        controls={
          <DemoControlPanel
            groups={ISING_GROUPS}
            extra={<IsingStats />}
            showStep
          />
        }
      />
    </Simulation>
  );
}

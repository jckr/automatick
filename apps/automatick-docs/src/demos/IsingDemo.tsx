import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import isingSim from '../sims/isingSim';

const GRID = 200;
const CSS_SIZE = 600;

function IsingCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof isingSim>((ctx, { data }) => {
    const scale = (CSS_SIZE * dpr) / CSS_SIZE;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

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
    <canvas
      ref={canvasRef}
      width={CSS_SIZE * dpr}
      height={CSS_SIZE * dpr}
      style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: 'auto' }}
    />
  );
}

function IsingStats() {
  const { data } = useSimulation<typeof isingSim>();
  return (
    <div style={{ fontSize: 13, opacity: 0.75, fontFamily: 'monospace' }}>
      magnetization: {data.magnetization.toFixed(3)} &nbsp; energy: {data.energy.toFixed(3)}
    </div>
  );
}

export function IsingDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={isingSim} delayMs={0} autoplay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'T',
              label: 'Temperature (T)',
              min: 0.5,
              max: 5,
              step: 0.05,
            },
            {
              type: 'range',
              param: 'externalField',
              label: 'External field (h)',
              min: -1,
              max: 1,
              step: 0.05,
            },
            {
              type: 'range',
              param: 'sweepsPerTick',
              label: 'Sweeps / tick',
              min: 1,
              max: 10,
              step: 1,
            },
          ]}
        />
        <IsingStats />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <IsingCanvas />
          {showPerf && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <PerformanceOverlay />
            </div>
          )}
        </div>
      </div>
    </Simulation>
  );
}

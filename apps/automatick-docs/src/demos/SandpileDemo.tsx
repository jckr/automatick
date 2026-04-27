import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import sandpileSim, { SANDPILE_WIDTH, SANDPILE_HEIGHT } from '../sims/sandpileSim';

const CSS_SIZE = 600;

const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [26, 26, 42],
  [80, 180, 120],
  [230, 210, 70],
  [240, 140, 40],
  [255, 70, 70],
];

function SandpileCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof sandpileSim>((ctx, { data }) => {
    const scale = (CSS_SIZE * dpr) / CSS_SIZE;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const W = SANDPILE_WIDTH;
    const H = SANDPILE_HEIGHT;

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
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
      imageDataRef.current.width !== W ||
      imageDataRef.current.height !== H
    ) {
      imageDataRef.current = offCtx.createImageData(W, H);
    }
    const imageData = imageDataRef.current;
    const px = imageData.data;
    const grid = data.grid;

    for (let i = 0; i < W * H; i++) {
      const c = grid[i];
      const p = PALETTE[c < 4 ? c : 4];
      const j = i * 4;
      px[j] = p[0];
      px[j + 1] = p[1];
      px[j + 2] = p[2];
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

export function SandpileDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={sandpileSim} delayMs={0} autoplay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'grainsPerTick',
              label: 'Grains per tick',
              min: 1,
              max: 100,
              step: 1,
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <SandpileCanvas />
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

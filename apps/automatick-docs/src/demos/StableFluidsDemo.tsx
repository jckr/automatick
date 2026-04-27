import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import stableFluidsSim, { GRID_N } from '../sims/stableFluidsSim';

const WIDTH = 600;
const HEIGHT = 600;

function StableFluidsCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssWidth = WIDTH;
  const cssHeight = HEIGHT;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof stableFluidsSim>(
    (ctx, { data }) => {
      const scale = (cssWidth * dpr) / WIDTH;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

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
    }
  );

  return (
    <canvas
      ref={canvasRef}
      width={cssWidth * dpr}
      height={cssHeight * dpr}
      style={{
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
        height: 'auto'
      }}
    />
  );
}

export function StableFluidsDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={stableFluidsSim} delayMs={0} autoplay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'visc',
              label: 'Viscosity',
              min: 0,
              max: 0.0001,
              step: 0.00001
            },
            {
              type: 'range',
              param: 'diff',
              label: 'Diffusion',
              min: 0,
              max: 0.0001,
              step: 0.00001
            },
            {
              type: 'range',
              param: 'dt',
              label: 'Timestep (dt)',
              min: 0.05,
              max: 0.3,
              step: 0.01
            },
            {
              type: 'range',
              param: 'forceStrength',
              label: 'Force strength',
              min: 10,
              max: 80,
              step: 5
            },
            {
              type: 'range',
              param: 'dissipation',
              label: 'Dissipation',
              min: 0,
              max: 3,
              step: 0.1
            },
            {
              type: 'range',
              param: 'radiusR',
              label: 'Radius R',
              min: 5,
              max: 55,
              step: 1
            },
            {
              type: 'range',
              param: 'speedR',
              label: 'Speed R',
              min: -0.1,
              max: 0.1,
              step: 0.005
            },
            {
              type: 'range',
              param: 'radiusG',
              label: 'Radius G',
              min: 5,
              max: 55,
              step: 1
            },
            {
              type: 'range',
              param: 'speedG',
              label: 'Speed G',
              min: -0.1,
              max: 0.1,
              step: 0.005
            },
            {
              type: 'range',
              param: 'radiusB',
              label: 'Radius B',
              min: 5,
              max: 55,
              step: 1
            },
            {
              type: 'range',
              param: 'speedB',
              label: 'Speed B',
              min: -0.1,
              max: 0.1,
              step: 0.005
            }
          ]}
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            opacity: 0.7
          }}
        >
          <input
            type='checkbox'
            checked={showPerf}
            onChange={(e) => setShowPerf(e.target.checked)}
          />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <StableFluidsCanvas />
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

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import grayScottSim from '../sims/grayScottSim';

const WIDTH = 600;
const HEIGHT = 600;

function GrayScottCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssWidth = WIDTH;
  const cssHeight = HEIGHT;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof grayScottSim>(
    (ctx, { data }) => {
      const scale = (cssWidth * dpr) / WIDTH;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      const w = data.width;
      const h = data.height;

      if (!offscreenRef.current) {
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
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
        imageDataRef.current.width !== w ||
        imageDataRef.current.height !== h
      ) {
        imageDataRef.current = offCtx.createImageData(w, h);
      }
      const imageData = imageDataRef.current;
      const px = imageData.data;

      for (let i = 0; i < w * h; i++) {
        const vRaw = data.v[i];
        const t = Math.min(Math.max(vRaw * 2.5, 0), 1);
        let r: number;
        let g: number;
        let b: number;
        if (t < 0.5) {
          const s = t * 2;
          r = Math.floor(20 + s * 220);
          g = Math.floor(30 + s * 200);
          b = Math.floor(90 + s * 40);
        } else {
          const s = (t - 0.5) * 2;
          r = Math.floor(240 - s * 20);
          g = Math.floor(230 - s * 180);
          b = Math.floor(130 - s * 110);
        }
        const j = i * 4;
        px[j] = r;
        px[j + 1] = g;
        px[j + 2] = b;
        px[j + 3] = 255;
      }
      offCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, WIDTH, HEIGHT);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  );

  return (
    <canvas
      ref={canvasRef}
      width={cssWidth * dpr}
      height={cssHeight * dpr}
      style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: 'auto' }}
    />
  );
}

export function GrayScottDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={grayScottSim} delayMs={0} autoplay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'F',
              label: 'Feed rate (F)',
              min: 0.01,
              max: 0.08,
              step: 0.001,
            },
            {
              type: 'range',
              param: 'k',
              label: 'Kill rate (k)',
              min: 0.04,
              max: 0.08,
              step: 0.001,
            },
            {
              type: 'range',
              param: 'dt',
              label: 'Timestep (dt)',
              min: 0.5,
              max: 1.5,
              step: 0.1,
            },
            {
              type: 'range',
              param: 'subTicks',
              label: 'Sub-ticks',
              min: 1,
              max: 10,
              step: 1,
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <GrayScottCanvas />
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

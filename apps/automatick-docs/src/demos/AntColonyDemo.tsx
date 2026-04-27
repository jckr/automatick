import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import antColonySim from '../sims/antColonySim';

const WIDTH = 600;
const HEIGHT = 600;
const HOME_X = 100;
const HOME_Y = 100;
const HOME_RADIUS = 5;

function AntColonyCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssWidth = WIDTH;
  const cssHeight = HEIGHT;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof antColonySim>(
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
        const f = Math.min(data.foodPher[i] * 0.5, 1);
        const hpv = Math.min(data.homePher[i] * 0.5, 1);
        const hasFood = data.food[i] > 0;
        const j = i * 4;
        if (hasFood) {
          px[j] = 255;
          px[j + 1] = 220;
          px[j + 2] = 80;
          px[j + 3] = 255;
        } else {
          px[j] = 10 + hpv * 80;
          px[j + 1] = 10 + f * 200;
          px[j + 2] = 20 + hpv * 200 + f * 40;
          px[j + 3] = 255;
        }
      }
      offCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, WIDTH, HEIGHT);

      const cellPx = WIDTH / w;

      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(HOME_X * cellPx, HOME_Y * cellPx, HOME_RADIUS * cellPx, 0, Math.PI * 2);
      ctx.fill();

      const n = data.antX.length;
      for (let i = 0; i < n; i++) {
        const ax = data.antX[i] * cellPx;
        const ay = data.antY[i] * cellPx;
        ctx.fillStyle = data.antCarrying[i] === 1 ? '#fff066' : '#ffffff';
        ctx.fillRect(ax - 1, ay - 1, 2, 2);
      }

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

export function AntColonyDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={antColonySim} delayMs={0} autoplay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'antCount',
              label: 'Ants',
              min: 100,
              max: 2000,
              step: 50,
            },
            {
              type: 'range',
              param: 'evaporation',
              label: 'Evaporation',
              min: 0,
              max: 0.05,
              step: 0.005,
            },
            {
              type: 'range',
              param: 'depositAmount',
              label: 'Deposit',
              min: 0.1,
              max: 2,
              step: 0.1,
            },
            {
              type: 'range',
              param: 'sensorAngle',
              label: 'Sensor angle',
              min: 0.1,
              max: 1.2,
              step: 0.05,
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <AntColonyCanvas />
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

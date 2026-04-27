import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import trafficSim, { TRAFFIC_ROAD_LENGTH, TRAFFIC_LANES } from '../sims/trafficSim';

const CSS_WIDTH = 900;
const CSS_HEIGHT = 200;
const LANE_HEIGHT = 20;
const OFFSCREEN_HEIGHT = TRAFFIC_LANES * LANE_HEIGHT;

const EMPTY_RGB: readonly [number, number, number] = [26, 26, 32];

const velocityColor = (v: number, vMax: number): [number, number, number] => {
  const t = vMax > 0 ? Math.min(v / vMax, 1) : 0;
  // blue (slow) -> yellow -> red (fast)
  if (t < 0.5) {
    const k = t * 2;
    return [Math.round(60 + (230 - 60) * k), Math.round(120 + (210 - 120) * k), Math.round(220 - (220 - 60) * k)];
  }
  const k = (t - 0.5) * 2;
  return [Math.round(230 + (255 - 230) * k), Math.round(210 - (210 - 70) * k), Math.round(60 - 60 * k)];
};

function TrafficCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof trafficSim>((ctx, { data, params }) => {
    const scale = (CSS_WIDTH * dpr) / CSS_WIDTH;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = TRAFFIC_ROAD_LENGTH;
      off.height = OFFSCREEN_HEIGHT;
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
      imageDataRef.current.width !== TRAFFIC_ROAD_LENGTH ||
      imageDataRef.current.height !== OFFSCREEN_HEIGHT
    ) {
      imageDataRef.current = offCtx.createImageData(TRAFFIC_ROAD_LENGTH, OFFSCREEN_HEIGHT);
    }
    const imageData = imageDataRef.current;
    const px = imageData.data;
    const lanes = data.lanes;
    const vMax = params.vMax;

    // Precompute palette for this frame: index vMax+1 reserved for empty.
    const palette = new Uint8ClampedArray((vMax + 2) * 3);
    for (let v = 0; v <= vMax; v++) {
      const c = velocityColor(v, vMax);
      palette[v * 3] = c[0];
      palette[v * 3 + 1] = c[1];
      palette[v * 3 + 2] = c[2];
    }
    const emptyOffset = (vMax + 1) * 3;
    palette[emptyOffset] = EMPTY_RGB[0];
    palette[emptyOffset + 1] = EMPTY_RGB[1];
    palette[emptyOffset + 2] = EMPTY_RGB[2];

    for (let lane = 0; lane < TRAFFIC_LANES; lane++) {
      const laneBase = lane * TRAFFIC_ROAD_LENGTH;
      // Fill the first row of this lane, then copy to remaining rows.
      const firstRowY = lane * LANE_HEIGHT;
      const firstRowStart = firstRowY * TRAFFIC_ROAD_LENGTH * 4;
      for (let x = 0; x < TRAFFIC_ROAD_LENGTH; x++) {
        const v = lanes[laneBase + x];
        const pi = (v < 0 ? emptyOffset : v * 3);
        const j = firstRowStart + x * 4;
        px[j] = palette[pi];
        px[j + 1] = palette[pi + 1];
        px[j + 2] = palette[pi + 2];
        px[j + 3] = 255;
      }
      // Replicate the first row into the other LANE_HEIGHT-1 rows.
      const rowBytes = TRAFFIC_ROAD_LENGTH * 4;
      for (let row = 1; row < LANE_HEIGHT; row++) {
        const dstStart = (firstRowY + row) * rowBytes;
        px.copyWithin(dstStart, firstRowStart, firstRowStart + rowBytes);
      }
    }
    offCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, CSS_WIDTH, CSS_HEIGHT);

    // Dashed lane dividers
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    for (let lane = 1; lane < TRAFFIC_LANES; lane++) {
      const y = (lane * CSS_HEIGHT) / TRAFFIC_LANES;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CSS_WIDTH, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={CSS_WIDTH * dpr}
      height={CSS_HEIGHT * dpr}
      style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: 'auto' }}
    />
  );
}

function TrafficStats() {
  const { data } = useSimulation<typeof trafficSim>();
  return (
    <div style={{ display: 'flex', gap: 18, fontSize: 13, fontFamily: 'monospace', opacity: 0.8 }}>
      <span>cars: {data.carCount}</span>
      <span>avg speed: {data.averageSpeed.toFixed(2)}</span>
    </div>
  );
}

export function TrafficDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={trafficSim} delayMs={0} autoplay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'density',
              label: 'Density (on reset)',
              min: 0.05,
              max: 0.6,
              step: 0.05,
            },
            {
              type: 'range',
              param: 'vMax',
              label: 'Max velocity',
              min: 2,
              max: 10,
              step: 1,
            },
            {
              type: 'range',
              param: 'pSlow',
              label: 'Random brake probability',
              min: 0,
              max: 0.5,
              step: 0.05,
            },
          ]}
        />
        <TrafficStats />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <TrafficCanvas />
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

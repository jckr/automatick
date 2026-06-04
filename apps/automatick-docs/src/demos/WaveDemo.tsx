import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import waveSim from '../sims/waveSim';
import styles from './WaveDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function WaveCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof waveSim>((ctx, { data }) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
    const cur = data.current;

    // Diverging palette around zero: negative -> blue, zero -> dark, positive -> red/white.
    for (let i = 0; i < w * h; i++) {
      const v = cur[i];
      const t = Math.max(-1, Math.min(1, v));
      let r: number;
      let g: number;
      let b: number;
      if (t >= 0) {
        // dark -> red -> white
        r = Math.floor(20 + t * 235);
        g = Math.floor(20 + t * t * 235);
        b = Math.floor(30 + t * t * 200);
      } else {
        const s = -t;
        // dark -> blue -> white
        b = Math.floor(40 + s * 215);
        g = Math.floor(20 + s * s * 200);
        r = Math.floor(20 + s * s * 180);
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
  });

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas
        ref={canvasRef}
        width={WIDTH * dpr}
        height={HEIGHT * dpr}
        className={styles.canvas}
      />
    </CanvasStage>
  );
}

const WAVE_GROUPS: DemoControlGroup[] = [
  {
    label: 'Wave',
    controls: [
      {
        type: 'range',
        param: 'damping',
        label: 'Damping',
        min: 0.9,
        max: 1.0,
        step: 0.005,
      },
      {
        type: 'range',
        param: 'speed',
        label: 'Speed',
        min: 0.05,
        max: 0.5,
        step: 0.05,
      },
    ],
  },
  {
    label: 'Source',
    controls: [
      {
        type: 'range',
        param: 'sourceFrequency',
        label: 'Frequency',
        min: 0.01,
        max: 0.2,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'sourceCount',
        label: 'Sources',
        min: 1,
        max: 4,
        step: 1,
      },
    ],
  },
];

export function WaveDemo() {
  return (
    <Simulation sim={waveSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<WaveCanvas />}
        controls={<DemoControlPanel groups={WAVE_GROUPS} />}
      />
    </Simulation>
  );
}

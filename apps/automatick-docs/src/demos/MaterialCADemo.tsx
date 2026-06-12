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
import materialCaSim, {
  EMPTY,
  SAND,
  WATER,
  FIRE,
  SMOKE,
  WOOD,
  type MaterialCAParams,
} from '../sims/materialCaSim';
import styles from './MaterialCADemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function MaterialCACanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);
  const paintingRef = React.useRef(false);
  const { setParams } = useSimulation<typeof materialCaSim>();

  const canvasRef = useSimulationCanvas<typeof materialCaSim>((ctx, { data }) => {
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
    const grid = data.grid;
    const energy = data.energy;

    for (let i = 0; i < w * h; i++) {
      const c = grid[i];
      let r = 18;
      let g = 18;
      let b = 24;
      if (c === SAND) {
        r = 222;
        g = 184;
        b = 96;
      } else if (c === WATER) {
        r = 40;
        g = 100;
        b = 210;
      } else if (c === WOOD) {
        r = 110;
        g = 70;
        b = 38;
      } else if (c === FIRE) {
        // hot (yellow) -> cooling (deep red) by remaining energy.
        const e = Math.max(0, Math.min(1, energy[i]));
        r = 255;
        g = Math.floor(60 + e * 180);
        b = Math.floor(e * 40);
      } else if (c === SMOKE) {
        const e = Math.max(0, Math.min(1, energy[i]));
        const shade = Math.floor(70 + e * 110);
        // Blend smoke shade over the dark background by its opacity.
        const a = 0.35 + e * 0.5;
        r = Math.floor(18 * (1 - a) + shade * a);
        g = Math.floor(18 * (1 - a) + shade * a);
        b = Math.floor(24 * (1 - a) + shade * a);
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

  const paintAt = React.useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const gx = Math.floor(((clientX - rect.left) / rect.width) * 200);
      const gy = Math.floor(((clientY - rect.top) / rect.height) * 200);
      setParams({ paintX: gx, paintY: gy } as Partial<MaterialCAParams>);
    },
    [canvasRef, setParams],
  );

  const stopPainting = React.useCallback(() => {
    paintingRef.current = false;
    setParams({ paintX: -1, paintY: -1 } as Partial<MaterialCAParams>);
  }, [setParams]);

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas
        ref={canvasRef}
        width={WIDTH * dpr}
        height={HEIGHT * dpr}
        className={styles.canvas}
        onPointerDown={(e) => {
          paintingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          paintAt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (paintingRef.current) paintAt(e.clientX, e.clientY);
        }}
        onPointerUp={stopPainting}
        onPointerLeave={stopPainting}
      />
    </CanvasStage>
  );
}

const MATERIAL_CA_GROUPS: DemoControlGroup[] = [
  {
    label: 'Brush',
    controls: [
      {
        type: 'chips',
        param: 'material',
        label: 'Material',
        options: [
          { value: SAND, label: 'Sand' },
          { value: WATER, label: 'Water' },
          { value: FIRE, label: 'Fire' },
          { value: WOOD, label: 'Wood' },
          { value: EMPTY, label: 'Eraser' },
        ],
      },
      { type: 'range', param: 'brushSize', label: 'Size', min: 1, max: 10, step: 1 },
    ],
  },
  {
    label: 'Fire behavior',
    controls: [
      {
        type: 'range',
        param: 'fireSpreadChance',
        label: 'Spread chance',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        type: 'range',
        param: 'smokeFadeRate',
        label: 'Smoke fade',
        min: 0.01,
        max: 0.2,
        step: 0.01,
      },
    ],
  },
];

export function MaterialCADemo() {
  return (
    <Simulation sim={materialCaSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<MaterialCACanvas />}
        controls={
          <DemoControlPanel
            groups={MATERIAL_CA_GROUPS}
            extra={
              <p className={styles.hint}>
                Click and drag on the canvas to paint the selected material.
              </p>
            }
          />
        }
      />
    </Simulation>
  );
}

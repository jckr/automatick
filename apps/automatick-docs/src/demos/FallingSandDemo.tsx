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
import fallingSandSim, {
  SAND_W,
  SAND_H,
  EMPTY,
  SAND,
  WATER,
  STONE,
} from '../sims/fallingSandSim';
import styles from './FallingSandDemo.module.css';

const CSS_WIDTH = 600;
const CSS_HEIGHT = 600;

const COLORS: Record<number, [number, number, number]> = {
  [EMPTY]: [20, 20, 28],
  [SAND]: [220, 180, 80],
  [WATER]: [50, 100, 210],
  [STONE]: [60, 65, 75],
};

function SandCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);
  const { setParams } = useSimulation<typeof fallingSandSim>();

  const toGrid = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * SAND_W);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * SAND_H);
      return [
        Math.max(0, Math.min(SAND_W - 1, x)),
        Math.max(0, Math.min(SAND_H - 1, y)),
      ];
    },
    [],
  );

  const onDown = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const [gx, gy] = toGrid(e);
      setParams({ paintX: gx, paintY: gy });
    },
    [toGrid, setParams],
  );

  const onMove = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.buttons === 0) return;
      const [gx, gy] = toGrid(e);
      setParams({ paintX: gx, paintY: gy });
    },
    [toGrid, setParams],
  );

  const onUp = React.useCallback(
    () => setParams({ paintX: -1, paintY: -1 }),
    [setParams],
  );

  const canvasRef = useSimulationCanvas<typeof fallingSandSim>((ctx, { data }) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = SAND_W;
      off.height = SAND_H;
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
      imageDataRef.current.width !== SAND_W ||
      imageDataRef.current.height !== SAND_H
    ) {
      imageDataRef.current = offCtx.createImageData(SAND_W, SAND_H);
    }
    const imageData = imageDataRef.current;
    const px = imageData.data;
    const { grid } = data;

    for (let i = 0; i < SAND_W * SAND_H; i++) {
      const c = COLORS[grid[i]] ?? COLORS[EMPTY];
      const j = i * 4;
      px[j] = c[0];
      px[j + 1] = c[1];
      px[j + 2] = c[2];
      px[j + 3] = 255;
    }

    offCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, CSS_WIDTH, CSS_HEIGHT);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <CanvasStage maxWidth={CSS_WIDTH}>
      <canvas
        ref={canvasRef}
        width={CSS_WIDTH * dpr}
        height={CSS_HEIGHT * dpr}
        className={styles.canvas}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
    </CanvasStage>
  );
}

const SAND_GROUPS: DemoControlGroup[] = [
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
          { value: STONE, label: 'Stone' },
        ],
      },
      {
        type: 'range',
        param: 'brushSize',
        label: 'Brush size',
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
  {
    label: 'Rain',
    controls: [
      {
        type: 'range',
        param: 'dropRate',
        label: 'Drops per tick',
        min: 0,
        max: 20,
        step: 1,
      },
    ],
  },
];

export function FallingSandDemo() {
  return (
    <Simulation sim={fallingSandSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<SandCanvas />}
        controls={<DemoControlPanel groups={SAND_GROUPS} />}
      />
    </Simulation>
  );
}

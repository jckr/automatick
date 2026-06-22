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
  [STONE]: [160, 155, 145],
};

function SandCanvas() {
  const { send } = useSimulation<typeof fallingSandSim>();

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
      send({ kind: 'paint', x: gx, y: gy });
    },
    [toGrid, send],
  );

  const onMove = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.buttons === 0) return;
      const [gx, gy] = toGrid(e);
      send({ kind: 'paint', x: gx, y: gy });
    },
    [toGrid, send],
  );

  const onUp = React.useCallback(() => send({ kind: 'lift' }), [send]);

  const canvasRef = useSimulationCanvas<typeof fallingSandSim>(
    (ctx, { data }, view) => {
      view.blitGrid(SAND_W, SAND_H, (px) => {
        const { grid } = data;
        for (let i = 0; i < SAND_W * SAND_H; i++) {
          const c = COLORS[grid[i]] ?? COLORS[EMPTY];
          const j = i * 4;
          px[j] = c[0];
          px[j + 1] = c[1];
          px[j + 2] = c[2];
          px[j + 3] = 255;
        }
      });
    },
    { width: CSS_WIDTH, height: CSS_HEIGHT },
  );

  return (
    <CanvasStage maxWidth={CSS_WIDTH}>
      <canvas
        ref={canvasRef}
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
          { value: EMPTY, label: 'Eraser' },
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
    <Simulation sim={fallingSandSim} pauseWhenHidden delayMs={0} autoplay>
      <DemoSplit
        preview={<SandCanvas />}
        controls={
          <DemoControlPanel
            groups={SAND_GROUPS}
            extra={
              <div className={styles.hint}>
                Click and drag on the canvas to draw. Sand and water also
                rain from the top edge.
              </div>
            }
          />
        }
      />
    </Simulation>
  );
}

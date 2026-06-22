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
} from '../sims/materialCaSim';
import styles from './MaterialCADemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;
const GRID = 200;

function MaterialCACanvas() {
  const { send } = useSimulation<typeof materialCaSim>();

  const toGrid = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * GRID);
      return [
        Math.max(0, Math.min(GRID - 1, x)),
        Math.max(0, Math.min(GRID - 1, y)),
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

  const canvasRef = useSimulationCanvas<typeof materialCaSim>(
    (ctx, { data }, view) => {
      const w = data.width;
      const h = data.height;
      const grid = data.grid;
      const energy = data.energy;

      view.blitGrid(w, h, (px) => {
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
      });
    },
    { width: WIDTH, height: HEIGHT }
  );

  return (
    <CanvasStage maxWidth={WIDTH}>
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
    <Simulation sim={materialCaSim} pauseWhenHidden delayMs={0} autoplay>
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

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import gravitySim from '../sims/gravitySim';
import { gravityPalette } from '../theme/palette';
import styles from './GravityDemo.module.css';

const WIDTH = 600;
const HEIGHT = 400;

const GENERATION_PALETTE: ReadonlyArray<{
  h: number;
  s: number;
  l: number;
}> = gravityPalette.generations;

function GravityCanvas() {
  const initializedRef = React.useRef(false);

  const canvasRef = useSimulationCanvas<typeof gravitySim>(
    (ctx, { data }, view) => {
      if (!initializedRef.current) {
        view.clear(gravityPalette.bg);
        initializedRef.current = true;
      }
      view.fade(0.15, gravityPalette.bg);

      data.particles.forEach((p) => {
        const c = GENERATION_PALETTE[p.generation % GENERATION_PALETTE.length];
        ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, ${gravityPalette.glowAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    { width: WIDTH, height: HEIGHT }
  );

  return (
    <CanvasStage maxWidth={WIDTH} minHeight={420}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const GRAVITY_GROUPS: DemoControlGroup[] = [
  {
    label: 'Bodies',
    controls: [
      {
        type: 'range',
        param: 'count',
        label: 'Particles',
        min: 50,
        max: 500,
        step: 10,
      },
      {
        type: 'range',
        param: 'G',
        label: 'Gravity (G)',
        min: 0.05,
        max: 2,
        step: 0.05,
      },
    ],
  },
];

export function GravityDemo() {
  return (
    <Simulation sim={gravitySim} delayMs={0} autoplay>
      <DemoSplit
        preview={<GravityCanvas />}
        controls={<DemoControlPanel groups={GRAVITY_GROUPS} showStep />}
      />
    </Simulation>
  );
}

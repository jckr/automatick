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
import styles from './GravityDemo.module.css';

const WIDTH = 600;
const HEIGHT = 400;

const GENERATION_PALETTE: Array<{ h: number; s: number; l: number }> = [
  { h: 220, s: 80, l: 60 },
  { h: 190, s: 85, l: 60 },
  { h: 140, s: 70, l: 55 },
  { h: 60, s: 90, l: 60 },
  { h: 30, s: 95, l: 60 },
  { h: 0, s: 85, l: 60 },
  { h: 320, s: 80, l: 65 },
  { h: 275, s: 75, l: 70 },
];

function GravityCanvas() {
  const initializedRef = React.useRef(false);

  const canvasRef = useSimulationCanvas<typeof gravitySim>(
    (ctx, { data }, view) => {
      if (!initializedRef.current) {
        view.clear('#0a0a1a');
        initializedRef.current = true;
      }
      view.fade(0.15, '#0a0a1a');

      data.particles.forEach((p) => {
        const c = GENERATION_PALETTE[p.generation % GENERATION_PALETTE.length];
        ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.3)`;
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
    <Simulation sim={gravitySim} pauseWhenHidden delayMs={0} autoplay>
      <DemoSplit
        preview={<GravityCanvas />}
        controls={<DemoControlPanel groups={GRAVITY_GROUPS} showStep />}
      />
    </Simulation>
  );
}

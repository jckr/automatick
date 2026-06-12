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
import doublePendulumSim from '../sims/doublePendulumSim';
import styles from './DoublePendulumDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;
const PIVOT_X = WIDTH / 2;
const PIVOT_Y = HEIGHT * 0.4;

function DoublePendulumCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const { resetWith, params } = useSimulation<typeof doublePendulumSim>();

  // Initial angles and the chip count seed init(), so changing them rebuilds.
  const seedRef = React.useRef<string>(
    `${params.initialTheta1}|${params.initialTheta2}|${params.chips}|${params.trailLength}`
  );
  React.useEffect(() => {
    const seed = `${params.initialTheta1}|${params.initialTheta2}|${params.chips}|${params.trailLength}`;
    if (seed !== seedRef.current) {
      seedRef.current = seed;
      resetWith();
    }
  }, [
    params.initialTheta1,
    params.initialTheta2,
    params.chips,
    params.trailLength,
    resetWith,
  ]);

  const canvasRef = useSimulationCanvas<typeof doublePendulumSim>(
    (ctx, { data, params: p }) => {
      const css = getComputedStyle(document.documentElement);
      const bg = css.getPropertyValue('--bg2').trim() || '#12161c';
      const ink = css.getPropertyValue('--fg1').trim() || '#e6e6e6';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const { L1, L2, m1, m2 } = p;
      const r1 = 4 + Math.sqrt(m1) * 3;
      const r2 = 4 + Math.sqrt(m2) * 3;

      for (let pi = 0; pi < data.pendulums.length; pi++) {
        const pen = data.pendulums[pi];
        const capacity = pen.trail.length / 2;

        // Fading trail drawn oldest -> newest from the ring buffer.
        if (pen.trailCount > 1) {
          for (let k = 1; k < pen.trailCount; k++) {
            const idxPrev =
              (pen.trailHead - pen.trailCount + k - 1 + capacity * 2) %
              capacity;
            const idxCur =
              (pen.trailHead - pen.trailCount + k + capacity * 2) % capacity;
            const ax = PIVOT_X + pen.trail[idxPrev * 2];
            const ay = PIVOT_Y + pen.trail[idxPrev * 2 + 1];
            const bx = PIVOT_X + pen.trail[idxCur * 2];
            const by = PIVOT_Y + pen.trail[idxCur * 2 + 1];
            const alpha = (k / pen.trailCount) * 0.85;
            ctx.strokeStyle = `hsla(${pen.hue}, 80%, 60%, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }

        // Arm + bob positions.
        const x1 = PIVOT_X + L1 * Math.sin(pen.theta1);
        const y1 = PIVOT_Y + L1 * Math.cos(pen.theta1);
        const x2 = x1 + L2 * Math.sin(pen.theta2);
        const y2 = y1 + L2 * Math.cos(pen.theta2);

        const armColor =
          data.pendulums.length > 1
            ? `hsla(${pen.hue}, 30%, 70%, 0.85)`
            : ink;
        ctx.strokeStyle = armColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PIVOT_X, PIVOT_Y);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.fillStyle = `hsl(${pen.hue}, 70%, 55%)`;
        ctx.beginPath();
        ctx.arc(x1, y1, r1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, r2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pivot.
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(PIVOT_X, PIVOT_Y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  );

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

const PENDULUM_GROUPS: DemoControlGroup[] = [
  {
    label: 'Initial (resets)',
    controls: [
      {
        type: 'range',
        param: 'initialTheta1',
        label: 'Angle 1',
        min: 0,
        max: 180,
        step: 5,
        format: (v: number) => `${v}°`,
      },
      {
        type: 'range',
        param: 'initialTheta2',
        label: 'Angle 2',
        min: 0,
        max: 180,
        step: 5,
        format: (v: number) => `${v}°`,
      },
      {
        type: 'chips',
        param: 'chips',
        label: 'Copies',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
        ],
      },
    ],
  },
  {
    label: 'Physics',
    controls: [
      { type: 'range', param: 'm1', label: 'Mass 1', min: 0.5, max: 5, step: 0.5 },
      { type: 'range', param: 'm2', label: 'Mass 2', min: 0.5, max: 5, step: 0.5 },
      { type: 'range', param: 'L1', label: 'Length 1', min: 50, max: 200, step: 10 },
      { type: 'range', param: 'L2', label: 'Length 2', min: 50, max: 200, step: 10 },
      { type: 'range', param: 'gravity', label: 'Gravity', min: 0.1, max: 3, step: 0.1 },
      {
        type: 'range',
        param: 'damping',
        label: 'Damping',
        min: 0.99,
        max: 1,
        step: 0.001,
        format: (v: number) => v.toFixed(3),
      },
    ],
  },
];

export function DoublePendulumDemo() {
  return (
    <Simulation sim={doublePendulumSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<DoublePendulumCanvas />}
        controls={<DemoControlPanel groups={PENDULUM_GROUPS} showStep />}
      />
    </Simulation>
  );
}

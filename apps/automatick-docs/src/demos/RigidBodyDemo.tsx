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
import rigidBodySim from '../sims/rigidBodySim';
import styles from './RigidBodyDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function RigidBodyCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const { resetWith, params } = useSimulation<typeof rigidBodySim>();

  // The body count is fixed at init, so a change must rebuild the scene.
  const countRef = React.useRef(params.count);
  React.useEffect(() => {
    if (params.count !== countRef.current) {
      countRef.current = params.count;
      resetWith();
    }
  }, [params.count, resetWith]);

  const canvasRef = useSimulationCanvas<typeof rigidBodySim>((ctx, { data }) => {
    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue('--bg2').trim() || '#12161c';
    const ink = css.getPropertyValue('--fg1').trim() || '#e6e6e6';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < data.bodies.length; i++) {
      const b = data.bodies[i];
      const speed = Math.hypot(b.vx, b.vy);
      const light = Math.min(45 + speed * 4, 70);
      ctx.fillStyle = `hsl(${b.hue}, 65%, ${light}%)`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsl(${b.hue}, 65%, 30%)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Floor line.
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT - 1);
    ctx.lineTo(WIDTH, HEIGHT - 1);
    ctx.stroke();
    ctx.globalAlpha = 1;

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

const RIGID_GROUPS: DemoControlGroup[] = [
  {
    label: 'Physics',
    controls: [
      { type: 'range', param: 'gravity', label: 'Gravity', min: 0, max: 2, step: 0.1 },
      {
        type: 'range',
        param: 'restitution',
        label: 'Bounciness',
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
  {
    label: 'Bodies',
    controls: [
      { type: 'range', param: 'count', label: 'Count', min: 5, max: 80, step: 1 },
      { type: 'toggle', param: 'drop', label: 'Drop more' },
    ],
  },
];

export function RigidBodyDemo() {
  return (
    <Simulation sim={rigidBodySim} delayMs={16} autoplay>
      <DemoSplit
        preview={<RigidBodyCanvas />}
        controls={<DemoControlPanel groups={RIGID_GROUPS} showStep />}
      />
    </Simulation>
  );
}

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
import clothSim from '../sims/clothSim';
import styles from './ClothDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function ClothCanvas() {
  const { resetWith, params } = useSimulation<typeof clothSim>();

  // Structure depends on the preset, so a preset change must rebuild the sim.
  const presetRef = React.useRef(params.preset);
  React.useEffect(() => {
    if (params.preset !== presetRef.current) {
      presetRef.current = params.preset;
      resetWith();
    }
  }, [params.preset, resetWith]);

  const canvasRef = useSimulationCanvas<typeof clothSim>((ctx, { data }, view) => {
    const ink = view.theme('--fg1', '#e6e6e6');
    const pinColor = view.theme('--viz-1', '#D7451E');

    view.clear(view.theme('--bg2', '#12161c'));

    const { points, constraints } = data;

    // Constraint links, tinted by tension (relaxed = ink, stretched = red).
    ctx.lineWidth = 1;
    for (let i = 0; i < constraints.length; i++) {
      const con = constraints[i];
      const pa = points[con.a];
      const pb = points[con.b];
      const dist = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      const stretch = con.restLength > 0 ? dist / con.restLength : 1;
      const tension = Math.min(Math.max(stretch - 1, 0) * 2.5, 1);
      const r = Math.round(120 + tension * 135);
      const g = Math.round(120 - tension * 90);
      const b = Math.round(130 - tension * 100);
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    // Pinned anchors.
    ctx.fillStyle = pinColor;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (!p.pinned) continue;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }

    // Subtle dot at every node for a fabric look.
    ctx.fillStyle = ink;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.pinned) continue;
      ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);
    }
  }, { width: WIDTH, height: HEIGHT });

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const CLOTH_GROUPS: DemoControlGroup[] = [
  {
    label: 'Setup',
    controls: [
      {
        type: 'chips',
        param: 'preset',
        label: 'Preset',
        options: [
          { value: 'cloth', label: 'Cloth' },
          { value: 'rope', label: 'Rope' },
        ],
      },
    ],
  },
  {
    label: 'Physics',
    controls: [
      { type: 'range', param: 'gravity', label: 'Gravity', min: 0, max: 2, step: 0.1 },
      { type: 'range', param: 'damping', label: 'Damping', min: 0.9, max: 1, step: 0.005 },
      {
        type: 'range',
        param: 'constraintIterations',
        label: 'Stiffness (iterations)',
        min: 1,
        max: 20,
        step: 1,
      },
      {
        type: 'range',
        param: 'tearThreshold',
        label: 'Tear threshold',
        min: 0,
        max: 5,
        step: 0.5,
        format: (v: number) => (v === 0 ? 'off' : v.toFixed(1)),
      },
    ],
  },
];

export function ClothDemo() {
  return (
    <Simulation sim={clothSim} delayMs={16} autoplay>
      <DemoSplit
        preview={<ClothCanvas />}
        controls={<DemoControlPanel groups={CLOTH_GROUPS} showStep />}
      />
    </Simulation>
  );
}

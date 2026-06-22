import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { PerformanceOverlay } from 'automatick/react/performance';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import boidsSim, { type BoidsParams } from '../sims/boidsSim';
import styles from './BoidsDemo.module.css';

function BoidsCanvas() {
  const { setParams, resetWith } = useSimulation<typeof boidsSim>();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);
  // Ownership mode needs the logical canvas size up front: track the
  // wrapper's measured size in state so the hook re-attaches on resize.
  const [size, setSize] = React.useState({ width: 332, height: 332 });

  const canvasRef = useSimulationCanvas<typeof boidsSim>((ctx, { data, params }, view) => {
    const bg = view.theme('--bg3', '#E6E0D0');
    const ink = view.theme('--fg1', '#0E1116');
    // Distinct dataviz colors per force, matching the legacy RGB intent:
    // separation = danger (vermillion), alignment = green (moss),
    // cohesion = blue (slate teal).
    const sepColor = view.theme('--viz-1', '#D7451E');
    const alignColor = view.theme('--viz-4', '#3D6B4B');
    const cohColor = view.theme('--viz-2', '#2B6E8F');

    view.clear(bg);

    // Pass 1: triangles for every boid.
    data.forEach((boid) => {
      const [px, py] = boid.position;
      const r = params.r;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(boid.angle);
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(r * 2, 0);
      ctx.lineTo(-r, -r);
      ctx.lineTo(-r, r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Pass 2: radius circles. 'all' = every boid (dense overlap),
    // 'few' = a 24-boid sample (readable), 'none' = skip.
    if (params.showCircles !== 'none') {
      const sampled = params.showCircles === 'few';
      const stride = sampled
        ? Math.max(1, Math.floor(data.length / 24))
        : 1;
      ctx.globalAlpha = sampled ? 0.55 : 0.3;
      ctx.lineWidth = sampled ? 1 : 0.75;
      for (let i = 0; i < data.length; i += stride) {
        const boid = data[i];
        const [px, py] = boid.position;
        ctx.save();
        ctx.translate(px, py);

        ctx.strokeStyle = sepColor;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(0, 0, params.separationDistance, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = alignColor;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, params.alignmentDistance, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = cohColor;
        ctx.setLineDash([1, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, params.cohesionDistance, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }, size);

  // Track the wrapper size; resize the canvas (via ownership mode) and tell
  // the sim its world bounds match the displayed pixel size so boids fill
  // the area and wrap at the visible edges.
  React.useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;

    const apply = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      setSize({ width: w, height: h });
      // First measurement: reseed boids across the actual world size.
      // Default params spawn them in a 332×332 box, which leaves them
      // clustered in the corner of any larger container.
      if (!initializedRef.current) {
        initializedRef.current = true;
        resetWith({ width: w, height: h } as Partial<BoidsParams>);
      } else {
        setParams({ width: w, height: h } as Partial<BoidsParams>);
      }
    };
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [setParams, resetWith]);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.perf}>
        <PerformanceOverlay />
      </div>
    </div>
  );
}

const BOIDS_GROUPS: DemoControlGroup[] = [
  {
    label: 'Flock',
    controls: [
      {
        type: 'range',
        param: 'nbBoids',
        label: 'Count',
        min: 10,
        max: 1000,
        step: 10,
      },
    ],
  },
  {
    label: 'Alignment',
    controls: [
      {
        type: 'range',
        param: 'alignmentCoefficient',
        label: 'Strength',
        min: 0,
        max: 3,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'alignmentDistance',
        label: 'Radius',
        min: 0,
        max: 50,
        step: 1,
      },
    ],
  },
  {
    label: 'Cohesion',
    controls: [
      {
        type: 'range',
        param: 'cohesionCoefficient',
        label: 'Strength',
        min: 0,
        max: 3,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'cohesionDistance',
        label: 'Radius',
        min: 0,
        max: 50,
        step: 1,
      },
    ],
  },
  {
    label: 'Separation',
    controls: [
      {
        type: 'range',
        param: 'separationCoefficient',
        label: 'Strength',
        min: 0,
        max: 3,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'separationDistance',
        label: 'Radius',
        min: 0,
        max: 50,
        step: 1,
      },
    ],
  },
  {
    label: 'Render',
    controls: [
      {
        type: 'chips',
        param: 'showCircles',
        label: 'Radius circles',
        options: [
          { value: 'none', label: 'None' },
          { value: 'few', label: 'Few' },
          { value: 'all', label: 'All' },
        ],
      },
    ],
  },
];

export function BoidsDemo() {
  return (
    <Simulation sim={boidsSim} pauseWhenHidden delayMs={16}>
      <DemoSplit
        preview={<BoidsCanvas />}
        controls={<DemoControlPanel groups={BOIDS_GROUPS} />}
      />
    </Simulation>
  );
}

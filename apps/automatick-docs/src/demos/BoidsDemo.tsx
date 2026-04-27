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

const STAGE_HEIGHT = 540;

function BoidsCanvas() {
  const { setParams, resetWith } = useSimulation<typeof boidsSim>();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);

  const canvasRef = useSimulationCanvas<typeof boidsSim>((ctx, { data, params }) => {
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--bg3').trim() || '#E6E0D0';
    const ink = styles.getPropertyValue('--fg1').trim() || '#0E1116';
    // Distinct dataviz colors per force, matching the legacy RGB intent:
    // separation = danger (vermillion), alignment = green (moss),
    // cohesion = blue (slate teal).
    const sepColor =
      styles.getPropertyValue('--viz-1').trim() || '#D7451E';
    const alignColor =
      styles.getPropertyValue('--viz-4').trim() || '#3D6B4B';
    const cohColor =
      styles.getPropertyValue('--viz-2').trim() || '#2B6E8F';
    const dpr = window.devicePixelRatio || 1;

    // Sim coords map 1:1 to CSS pixels; scale by dpr so the framebuffer is sharp.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, params.width, params.height);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, params.width, params.height);

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

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  // Track the wrapper size; resize the canvas framebuffer and tell the sim
  // its world bounds match the displayed pixel size so boids fill the area
  // and wrap at the visible edges.
  React.useEffect(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const apply = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
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
  }, [canvasRef, setParams, resetWith]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: STAGE_HEIGHT,
        lineHeight: 0,
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
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
    <Simulation sim={boidsSim} delayMs={16}>
      <DemoSplit
        preview={<BoidsCanvas />}
        controls={<DemoControlPanel groups={BOIDS_GROUPS} />}
      />
    </Simulation>
  );
}

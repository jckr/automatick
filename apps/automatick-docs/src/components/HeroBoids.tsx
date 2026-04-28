import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { PerformanceOverlay } from 'automatick/react/performance';
import boidsSim, { type BoidsParams } from '../sims/boidsSim';

const initialParams = {
  alignmentCoefficient: 1.1,
  alignmentDistance: 50,
  cohesionCoefficient: 1.0,
  cohesionDistance: 60,
  height: 380,
  maxforce: 0.04,
  maxspeed: 2.2,
  nbBoids: 140,
  r: 2,
  separationCoefficient: 1.6,
  separationDistance: 22,
  showCircles: 'none' as const,
  width: 500,
};

function pad(n: number, width: number) {
  return String(n).padStart(width, '0');
}

function HeroCanvas() {
  const { setParams, resetWith } = useSimulation<typeof boidsSim>();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);

  const canvasRef = useSimulationCanvas<typeof boidsSim>((ctx, { data, params }) => {
    const styles = getComputedStyle(document.documentElement);
    const accent = styles.getPropertyValue('--accent').trim() || '#D7451E';
    const inkSoft = styles.getPropertyValue('--fg2').trim() || '#2A2E36';
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, params.width, params.height);

    data.forEach((boid, i) => {
      const [px, py] = boid.position;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(boid.angle);
      ctx.fillStyle = i % 5 === 0 ? inkSoft : accent;
      ctx.beginPath();
      ctx.moveTo(params.r * 2, 0);
      ctx.lineTo(-params.r, -params.r);
      ctx.lineTo(-params.r, params.r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

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
      style={{ position: 'absolute', inset: 0, lineHeight: 0 }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}

function TickReadout() {
  const { tick } = useSimulation();
  return <span className='val'>{pad(tick, 5)}</span>;
}

export function HeroBoids() {
  return (
    <Simulation sim={boidsSim} delayMs={16} params={initialParams} autoplay>
      <div className='hero-sim'>
        <div className='chrome'>
          <span className='dot' />
          <span className='file'>boids.tsx</span>
        </div>
        <div className='stage'>
          <HeroCanvas />
          <div className='sim-label'>sim · boids · 140 agents</div>
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <PerformanceOverlay />
          </div>
        </div>
        <div className='footer'>
          <span>tick</span>
          <div style={{ flex: 1 }} />
          <TickReadout />
        </div>
      </div>
    </Simulation>
  );
}

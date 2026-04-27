import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import boidsSim from '../sims/boidsSim';

function BoidsCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssSize = 600;

  const canvasRef = useSimulationCanvas<typeof boidsSim>((ctx, { data, params }) => {
    const scale = (cssSize * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    ctx.clearRect(0, 0, params.width, params.height);
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, params.width, params.height);

    data.forEach((boid) => {
      const [px, py] = boid.position;
      const angle = boid.angle;
      const r = params.r;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);

      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.moveTo(r * 2, 0);
      ctx.lineTo(-r, -r);
      ctx.lineTo(-r, r);
      ctx.closePath();
      ctx.fill();

      if (params.showCircles) {
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1 / scale;

        ctx.strokeStyle = '#f00';
        ctx.beginPath();
        ctx.arc(0, 0, params.separationDistance, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(0, 0, params.alignmentDistance, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00f';
        ctx.beginPath();
        ctx.arc(0, 0, params.cohesionDistance, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={cssSize * dpr}
      height={cssSize * dpr}
      style={{
        width: '100%',
        height: 'auto',
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: 6,
      }}
    />
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 13,
  opacity: 0.6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginTop: 4,
};

export function BoidsDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={boidsSim} delayMs={16}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          controls={[
            {
              type: 'range',
              param: 'nbBoids',
              label: 'Number of boids',
              min: 10,
              max: 1000,
              step: 10,
            },
            // -- Alignment --
            {
              type: 'range',
              param: 'alignmentCoefficient',
              label: 'Alignment',
              min: 0,
              max: 3,
              step: 0.01,
            },
            {
              type: 'range',
              param: 'alignmentDistance',
              label: 'Alignment radius',
              min: 0,
              max: 50,
              step: 1,
            },
            // -- Cohesion --
            {
              type: 'range',
              param: 'cohesionCoefficient',
              label: 'Cohesion',
              min: 0,
              max: 3,
              step: 0.01,
            },
            {
              type: 'range',
              param: 'cohesionDistance',
              label: 'Cohesion radius',
              min: 0,
              max: 50,
              step: 1,
            },
            // -- Separation --
            {
              type: 'range',
              param: 'separationCoefficient',
              label: 'Separation',
              min: 0,
              max: 3,
              step: 0.01,
            },
            {
              type: 'range',
              param: 'separationDistance',
              label: 'Separation radius',
              min: 0,
              max: 50,
              step: 1,
            },
            // -- Display --
            {
              type: 'toggle',
              param: 'showCircles',
              label: 'Show radius circles',
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <BoidsCanvas />
          {showPerf && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <PerformanceOverlay />
            </div>
          )}
        </div>
      </div>
    </Simulation>
  );
}

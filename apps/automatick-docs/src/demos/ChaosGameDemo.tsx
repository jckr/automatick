import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import chaosGameSim from '../sims/chaosGameSim';

function RulesToggle() {
  const { params, setParams } = useSimulation<typeof chaosGameSim>();
  const { nbAttractors, rules } = params;
  const padded = rules.padEnd(nbAttractors, '1').slice(0, nbAttractors);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, color: '#555' }}>Vertex rules</span>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {[...Array(nbAttractors).keys()].map((i) => {
          const on = padded[i] === '1';
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                const chars = padded.split('');
                chars[i] = on ? '0' : '1';
                setParams({ rules: chars.join('') });
              }}
              style={{
                minWidth: 36,
                height: 32,
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.2)',
                background: on ? '#4a90d9' : '#e0e0e0',
                color: on ? '#fff' : '#666',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChaosCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssSize = 600;
  const drawnCountRef = React.useRef(0);
  const bgRef = React.useRef<string | null>(null);

  const canvasRef = useSimulationCanvas<typeof chaosGameSim>((ctx, { data, params }) => {
    if (!data) return;

    const scale = (cssSize * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const { points, background, color, attractors } = data;

    // Reset drawn count when background changes (new init)
    if (background !== bgRef.current) {
      drawnCountRef.current = 0;
      bgRef.current = background;
    }

    // Draw background on first frame or reset
    if (drawnCountRef.current === 0) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, params.width, params.height);

      // Draw attractor markers
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      attractors.forEach((a: { x: number; y: number }) => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw only new points
    ctx.fillStyle = color;
    for (let i = drawnCountRef.current; i < points.length; i++) {
      ctx.fillRect(points[i].x, points[i].y, 1, 1);
    }
    drawnCountRef.current = points.length;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={cssSize * dpr}
      height={cssSize * dpr}
      style={{ border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, width: '100%', height: 'auto' }}
    />
  );
}

export function ChaosGameDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={chaosGameSim} maxTime={100000} delayMs={0} ticksPerFrame={100}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          maxTime={100000}
          controls={[
            {
              type: 'range',
              param: 'nbAttractors',
              label: 'Attractors',
              min: 3,
              max: 12,
              step: 1,
            },
            {
              type: 'range',
              param: 'r',
              label: 'Ratio',
              min: 0.1,
              max: 2,
              step: 0.05,
            },
          ]}
        />
        <RulesToggle />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <ChaosCanvas />
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

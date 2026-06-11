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
import chaosGameSim from '../sims/chaosGameSim';
import styles from './ChaosGameDemo.module.css';

const CSS_SIZE = 600;

function VertexRulesPanel() {
  const { params, setParams } = useSimulation<typeof chaosGameSim>();
  const { nbAttractors, rules } = params;
  const padded = rules.padEnd(nbAttractors, '1').slice(0, nbAttractors);

  return (
    <div className='group'>
      <div className='g-lbl'>Vertex rules</div>
      <div className='chips'>
        {[...Array(nbAttractors).keys()].map((i) => {
          const on = padded[i] === '1';
          return (
            <button
              key={i}
              type='button'
              className={`chip${on ? ' accent' : ''}`}
              onClick={() => {
                const chars = padded.split('');
                chars[i] = on ? '0' : '1';
                setParams({ rules: chars.join('') });
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
  const drawnCountRef = React.useRef(0);
  const bgRef = React.useRef<string | null>(null);
  const dprRef = React.useRef<number | null>(null);

  const canvasRef = useSimulationCanvas<typeof chaosGameSim>(
    (ctx, { data, params }, view) => {
      // Draw in sim coordinates scaled to the canvas. The renderer is
      // incremental (only new points each frame), so when a dpr change
      // resizes (and wipes) the backing store, redraw from point zero.
      const scale = CSS_SIZE / params.width;
      ctx.save();
      ctx.scale(scale, scale);

      const { points, background, color, attractors } = data;

      if (view.dpr !== dprRef.current) {
        drawnCountRef.current = 0;
        dprRef.current = view.dpr;
      }
      if (background !== bgRef.current) {
        drawnCountRef.current = 0;
        bgRef.current = background;
      }
      if (drawnCountRef.current === 0) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, params.width, params.height);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        attractors.forEach((a) => {
          ctx.beginPath();
          ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.fillStyle = color;
      for (let i = drawnCountRef.current; i < points.length; i++) {
        ctx.fillRect(points[i].x, points[i].y, 1, 1);
      }
      drawnCountRef.current = points.length;
      ctx.restore();
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <div className={styles.stage}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.perf}>
        <PerformanceOverlay />
      </div>
    </div>
  );
}

const CHAOS_GROUPS: DemoControlGroup[] = [
  {
    label: 'Polygon',
    controls: [
      {
        type: 'range',
        param: 'nbAttractors',
        label: 'Vertices',
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
    ],
  },
];

export function ChaosGameDemo() {
  return (
    <Simulation sim={chaosGameSim} maxTime={100000} delayMs={0} ticksPerFrame={100}>
      <DemoSplit
        preview={<ChaosCanvas />}
        controls={
          <DemoControlPanel groups={CHAOS_GROUPS} extra={<VertexRulesPanel />} />
        }
      />
    </Simulation>
  );
}

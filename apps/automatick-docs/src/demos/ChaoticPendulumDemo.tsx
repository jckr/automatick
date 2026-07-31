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
import chaoticPendulumSim, { MAX_TRAIL } from '../sims/chaoticPendulumSim';
import styles from './ChaoticPendulumDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;
const PIVOT_X = WIDTH / 2;
const PIVOT_Y = HEIGHT * 0.4;

const MIN_NODES = 1;
const MAX_NODES = 8;
const DEFAULT_LENGTH = 110;
const DEFAULT_MASS = 2;

function ChaoticPendulumCanvas() {
  const { resetWith, params } = useSimulation<typeof chaoticPendulumSim>();

  // The starting pose (angle/spread) and the chip count seed init(), so
  // changing them rebuilds the run. Node count, arm lengths, masses and the
  // trail length are all live and deliberately excluded from the seed.
  const seedRef = React.useRef<string>(
    `${params.initialAngle}|${params.spread}|${params.chips}`
  );
  React.useEffect(() => {
    const seed = `${params.initialAngle}|${params.spread}|${params.chips}`;
    if (seed !== seedRef.current) {
      seedRef.current = seed;
      resetWith();
    }
  }, [params.initialAngle, params.spread, params.chips, resetWith]);

  const canvasRef = useSimulationCanvas<typeof chaoticPendulumSim>(
    (ctx, { data, params: p }, view) => {
      const ink = view.theme('--fg1', '#e6e6e6');
      view.clear(view.theme('--bg2', '#12161c'));

      const { lengths, masses, trailLength } = p;
      const multi = data.pendulums.length > 1;

      for (const pen of data.pendulums) {
        // Draw only nodes present in both the live state and current params,
        // so a just-added/removed arm renders cleanly on the reconciling tick.
        const n = Math.min(pen.theta.length, lengths.length);

        // Fading trail: the most-recent `trailLength` tip positions.
        const drawCount = Math.min(pen.trailCount, Math.max(0, trailLength));
        if (drawCount > 1) {
          for (let k = 1; k < drawCount; k++) {
            const idxPrev =
              (pen.trailHead - drawCount + k - 1 + MAX_TRAIL) % MAX_TRAIL;
            const idxCur =
              (pen.trailHead - drawCount + k + MAX_TRAIL) % MAX_TRAIL;
            const ax = PIVOT_X + pen.trail[idxPrev * 2];
            const ay = PIVOT_Y + pen.trail[idxPrev * 2 + 1];
            const bx = PIVOT_X + pen.trail[idxCur * 2];
            const by = PIVOT_Y + pen.trail[idxCur * 2 + 1];
            const alpha = (k / drawCount) * 0.85;
            ctx.strokeStyle = `hsla(${pen.hue}, 80%, 60%, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }

        // Joint positions down the chain.
        const xs = [PIVOT_X];
        const ys = [PIVOT_Y];
        for (let i = 0; i < n; i++) {
          xs.push(xs[i] + lengths[i] * Math.sin(pen.theta[i]));
          ys.push(ys[i] + lengths[i] * Math.cos(pen.theta[i]));
        }

        // Arms.
        ctx.strokeStyle = multi ? `hsla(${pen.hue}, 30%, 70%, 0.85)` : ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (let i = 1; i <= n; i++) ctx.lineTo(xs[i], ys[i]);
        ctx.stroke();

        // Bobs, sized by mass.
        ctx.fillStyle = `hsl(${pen.hue}, 70%, 55%)`;
        for (let i = 0; i < n; i++) {
          const r = 4 + Math.sqrt(masses[i] ?? DEFAULT_MASS) * 3;
          ctx.beginPath();
          ctx.arc(xs[i + 1], ys[i + 1], r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pivot.
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(PIVOT_X, PIVOT_Y, 4, 0, Math.PI * 2);
      ctx.fill();
    },
    { width: WIDTH, height: HEIGHT }
  );

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

/**
 * Live editor for the chain itself: add/remove nodes and tune each arm's
 * length and each bob's mass. All edits go through `setParams` on the
 * `lengths` / `masses` arrays, which the sim consults every step — so the
 * chain grows, shrinks and reshapes without resetting the run.
 */
function ChainEditor() {
  const { params, setParams } = useSimulation<typeof chaoticPendulumSim>();
  const { lengths, masses } = params;
  const count = lengths.length;

  const addNode = () => {
    if (count >= MAX_NODES) return;
    setParams({
      lengths: [...lengths, DEFAULT_LENGTH],
      masses: [...masses, DEFAULT_MASS],
    });
  };

  const removeNode = () => {
    if (count <= MIN_NODES) return;
    setParams({
      lengths: lengths.slice(0, -1),
      masses: masses.slice(0, -1),
    });
  };

  const setLength = (i: number, value: number) =>
    setParams({ lengths: lengths.map((v, idx) => (idx === i ? value : v)) });

  const setMass = (i: number, value: number) =>
    setParams({ masses: masses.map((v, idx) => (idx === i ? value : v)) });

  return (
    <div className='group'>
      <div className='g-lbl'>Chain ({count} nodes)</div>
      <div className={styles.nodeButtons}>
        <button
          type='button'
          className='chip'
          onClick={removeNode}
          disabled={count <= MIN_NODES}
        >
          − Remove node
        </button>
        <button
          type='button'
          className='chip'
          onClick={addNode}
          disabled={count >= MAX_NODES}
        >
          + Add node
        </button>
      </div>
      {lengths.map((len, i) => (
        <div key={i} className={styles.nodeRow}>
          <div className={styles.nodeLabel}>Node {i + 1}</div>
          <label className={styles.nodeCtrl}>
            <span>Arm</span>
            <input
              type='range'
              min={40}
              max={200}
              step={5}
              value={len}
              onChange={(e) => setLength(i, Number(e.target.value))}
            />
            <span className={styles.nodeVal}>{len}</span>
          </label>
          <label className={styles.nodeCtrl}>
            <span>Mass</span>
            <input
              type='range'
              min={0.5}
              max={5}
              step={0.5}
              value={masses[i] ?? DEFAULT_MASS}
              onChange={(e) => setMass(i, Number(e.target.value))}
            />
            <span className={styles.nodeVal}>{masses[i] ?? DEFAULT_MASS}</span>
          </label>
        </div>
      ))}
    </div>
  );
}

const PENDULUM_GROUPS: DemoControlGroup[] = [
  {
    label: 'Start (resets)',
    controls: [
      {
        type: 'range',
        param: 'initialAngle',
        label: 'Angle',
        min: 0,
        max: 180,
        step: 5,
        format: (v: number) => `${v}°`,
      },
      {
        type: 'range',
        param: 'spread',
        label: 'Spread / node',
        min: -30,
        max: 30,
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
      {
        type: 'range',
        param: 'trailLength',
        label: 'Trail',
        min: 0,
        max: MAX_TRAIL,
        step: 50,
      },
    ],
  },
];

export function ChaoticPendulumDemo() {
  return (
    <Simulation sim={chaoticPendulumSim} delayMs={0} autoplay>
      <DemoSplit
        preview={<ChaoticPendulumCanvas />}
        controls={
          <DemoControlPanel
            groups={PENDULUM_GROUPS}
            showStep
            extra={<ChainEditor />}
          />
        }
      />
    </Simulation>
  );
}

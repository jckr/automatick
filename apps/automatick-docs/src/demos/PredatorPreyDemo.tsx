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
import { TimeSeries, TimeSeriesEntry } from '../components/TimeSeries';
import predatorPreySim, {
  PREY_RADIUS,
  PREDATOR_RADIUS,
} from '../sims/predatorPreySim';
import type { PredatorPreyData } from '../sims/predatorPreySim';
import styles from './PredatorPreyDemo.module.css';

const CSS_SIZE = 600;
const PREY_COLOR = '#2ecc71';
const PREDATOR_COLOR = '#e74c3c';
/** How many recent positions to keep per agent for its trail. */
const TRAIL_LEN = 20;

type TrailAgent = { x: number; y: number; vx: number; vy: number; type: string };

function PredatorPreyCanvas() {
  // Per-agent position history, keyed by the agent object itself. The engine
  // reuses agent objects across ticks (no cloning in local mode), so surviving
  // agents accumulate a trail while dead ones are dropped from the map by GC.
  const trailsRef = React.useRef(new WeakMap<TrailAgent, number[]>());
  const lastTickRef = React.useRef(-1);

  const canvasRef = useSimulationCanvas<typeof predatorPreySim>(
    (ctx, { data, params, tick }, view) => {
      const scale = CSS_SIZE / params.worldWidth;
      view.clear(view.theme('--bg3', '#14181f'));

      const trails = trailsRef.current;
      // Only extend trails when the tick actually advanced — the engine also
      // emits on pause / param changes, which must not duplicate positions.
      const advanced = tick !== lastTickRef.current;
      lastTickRef.current = tick;

      const wrapJump = CSS_SIZE / 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Trails: a comet tail per agent that tapers in width and opacity from
      // tail to head, breaking across world-wrap jumps.
      for (const a of data.agents) {
        let hist = trails.get(a);
        if (!hist) {
          hist = [];
          trails.set(a, hist);
        }
        if (advanced) {
          hist.push(a.x * scale, a.y * scale);
          if (hist.length > TRAIL_LEN * 2) {
            hist.splice(0, hist.length - TRAIL_LEN * 2);
          }
        }

        const pts = hist.length / 2;
        if (pts < 2) continue;
        const isPrey = a.type === 'prey';
        const maxAlpha = isPrey ? 0.35 : 0.55;
        const maxWidth = isPrey ? 1.0 : 1.8;
        ctx.strokeStyle = isPrey ? PREY_COLOR : PREDATOR_COLOR;
        for (let k = 1; k < pts; k++) {
          const x0 = hist[(k - 1) * 2];
          const y0 = hist[(k - 1) * 2 + 1];
          const x1 = hist[k * 2];
          const y1 = hist[k * 2 + 1];
          if (Math.abs(x1 - x0) > wrapJump || Math.abs(y1 - y0) > wrapJump) {
            continue;
          }
          const t = k / (pts - 1);
          ctx.globalAlpha = maxAlpha * t;
          ctx.lineWidth = maxWidth * (0.3 + 0.7 * t);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Prey heads: small green dots.
      ctx.fillStyle = PREY_COLOR;
      for (const a of data.agents) {
        if (a.type !== 'prey') continue;
        ctx.beginPath();
        ctx.arc(a.x * scale, a.y * scale, PREY_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      // Predator heads: triangles pointing in their direction of travel.
      const tip = PREDATOR_RADIUS + 2;
      ctx.fillStyle = PREDATOR_COLOR;
      for (const a of data.agents) {
        if (a.type !== 'predator') continue;
        const angle = Math.atan2(a.vy, a.vx);
        ctx.save();
        ctx.translate(a.x * scale, a.y * scale);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(tip, 0);
        ctx.lineTo(-tip * 0.7, tip * 0.7);
        ctx.lineTo(-tip * 0.7, -tip * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <div className={styles.stage}>
      <CanvasStage maxWidth={CSS_SIZE}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </CanvasStage>
      <div className={styles.chartWrap}>
        <TimeSeries<PredatorPreyData>
          mode='line'
          height={130}
          series={POPULATION_SERIES}
        />
      </div>
    </div>
  );
}

const POPULATION_SERIES: TimeSeriesEntry<PredatorPreyData>[] = [
  { color: PREY_COLOR, label: 'Prey', accessor: (d) => d.preyCount },
  { color: PREDATOR_COLOR, label: 'Predators', accessor: (d) => d.predatorCount },
];

function PopulationStats() {
  const { data } = useSimulation<typeof predatorPreySim>();
  return (
    <div className='group'>
      <div className='g-lbl'>Status</div>
      <div className={styles.stats}>
        <div className={styles.row}>
          <span className={styles.label}>prey</span>
          <span className={styles.value}>{data.preyCount}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>predators</span>
          <span className={styles.value}>{data.predatorCount}</span>
        </div>
      </div>
    </div>
  );
}

const PREDATOR_PREY_GROUPS: DemoControlGroup[] = [
  {
    label: 'Population (resets)',
    controls: [
      {
        type: 'range',
        param: 'initialPrey',
        label: 'Initial prey',
        min: 20,
        max: 500,
        step: 10,
      },
      {
        type: 'range',
        param: 'initialPredators',
        label: 'Initial predators',
        min: 5,
        max: 100,
        step: 5,
      },
    ],
  },
  {
    label: 'Prey',
    controls: [
      {
        type: 'range',
        param: 'preyReproduceChance',
        label: 'Reproduce chance',
        min: 0.005,
        max: 0.1,
        step: 0.005,
        format: (v) => v.toFixed(3),
      },
      {
        type: 'range',
        param: 'preyCarryingCapacity',
        label: 'Carrying capacity',
        min: 200,
        max: 1500,
        step: 50,
      },
      {
        type: 'range',
        param: 'preySpeed',
        label: 'Speed',
        min: 0.5,
        max: 5,
        step: 0.5,
      },
    ],
  },
  {
    label: 'Predators',
    controls: [
      {
        type: 'range',
        param: 'predatorHuntRadius',
        label: 'Hunt radius',
        min: 20,
        max: 120,
        step: 5,
      },
      {
        type: 'range',
        param: 'predatorEnergyGain',
        label: 'Energy per kill',
        min: 6,
        max: 30,
        step: 1,
      },
      {
        type: 'range',
        param: 'predatorEnergyLoss',
        label: 'Energy loss',
        min: 0.1,
        max: 1.5,
        step: 0.05,
        format: (v) => v.toFixed(2),
      },
    ],
  },
];

export function PredatorPreyDemo() {
  return (
    <Simulation sim={predatorPreySim} pauseWhenHidden delayMs={16} autoplay>
      <DemoSplit
        preview={<PredatorPreyCanvas />}
        controls={
          <DemoControlPanel
            groups={PREDATOR_PREY_GROUPS}
            extra={<PopulationStats />}
            showStep
          />
        }
      />
    </Simulation>
  );
}

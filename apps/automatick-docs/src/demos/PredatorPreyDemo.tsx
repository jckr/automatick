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

function PredatorPreyCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const lastTickRef = React.useRef(-1);
  const canvasRef = useSimulationCanvas<typeof predatorPreySim>(
    (ctx, { data, params, tick }) => {
      const scale = CSS_SIZE / params.worldWidth;
      const cssStyles = getComputedStyle(document.documentElement);
      const bg = cssStyles.getPropertyValue('--bg3').trim() || '#14181f';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (tick === 0 || tick < lastTickRef.current) {
        // Fresh start or reset: wipe to a clean background.
        ctx.globalAlpha = 1;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, CSS_SIZE, CSS_SIZE);
      } else {
        // Fade the previous frame toward the background so agents leave trails.
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, CSS_SIZE, CSS_SIZE);
        ctx.globalAlpha = 1;
      }
      lastTickRef.current = tick;

      // Prey: small green dots.
      ctx.fillStyle = PREY_COLOR;
      for (const a of data.agents) {
        if (a.type !== 'prey') continue;
        ctx.beginPath();
        ctx.arc(a.x * scale, a.y * scale, PREY_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      // Predators: triangles pointing in their direction of travel.
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

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  );

  return (
    <div className={styles.stage}>
      <CanvasStage maxWidth={CSS_SIZE}>
        <canvas
          ref={canvasRef}
          width={CSS_SIZE * dpr}
          height={CSS_SIZE * dpr}
          className={styles.canvas}
        />
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
    <Simulation sim={predatorPreySim} delayMs={16} autoplay>
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

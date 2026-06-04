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
import opinionDynamicsSim from '../sims/opinionDynamicsSim';
import type { OpinionData } from '../sims/opinionDynamicsSim';
import styles from './OpinionDynamicsDemo.module.css';

const CSS_SIZE = 600;

/** Diverging color scale: blue (0) -> light (0.5) -> red (1). */
function opinionColor(o: number): string {
  if (o < 0.5) {
    const t = o * 2;
    const r = Math.floor(60 + t * 175);
    const g = Math.floor(110 + t * 125);
    const b = Math.floor(210 + t * 25);
    return `rgb(${r},${g},${b})`;
  }
  const t = (o - 0.5) * 2;
  const r = Math.floor(235 - t * 4);
  const g = Math.floor(235 - t * 175);
  const b = Math.floor(235 - t * 175);
  return `rgb(${r},${g},${b})`;
}

function OpinionCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const canvasRef = useSimulationCanvas<typeof opinionDynamicsSim>(
    (ctx, { data }) => {
      const scale = CSS_SIZE / data.worldSize;
      const cssStyles = getComputedStyle(document.documentElement);
      const bg = cssStyles.getPropertyValue('--bg3').trim() || '#14181f';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CSS_SIZE, CSS_SIZE);

      for (const a of data.agents) {
        ctx.fillStyle = opinionColor(a.opinion);
        ctx.beginPath();
        ctx.arc(a.x * scale, a.y * scale, 4, 0, Math.PI * 2);
        ctx.fill();
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
        <TimeSeries<OpinionData> mode='line' height={130} series={SERIES} />
      </div>
    </div>
  );
}

const SERIES: TimeSeriesEntry<OpinionData>[] = [
  {
    color: '#9b59b6',
    label: 'Polarization ×1000',
    accessor: (d) => d.polarization * 1000,
  },
  { color: '#1abc9c', label: 'Clusters', accessor: (d) => d.clusters },
];

function OpinionStats() {
  const { data } = useSimulation<typeof opinionDynamicsSim>();
  return (
    <div className='group'>
      <div className='g-lbl'>Status</div>
      <div className={styles.stats}>
        <div className={styles.row}>
          <span className={styles.label}>clusters</span>
          <span className={styles.value}>{data.clusters}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>avg opinion</span>
          <span className={styles.value}>
            {data.averageOpinion.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}

const GROUPS: DemoControlGroup[] = [
  {
    label: 'Population (resets)',
    controls: [
      {
        type: 'range',
        param: 'numAgents',
        label: 'Agents',
        min: 50,
        max: 500,
        step: 25,
      },
      {
        type: 'chips',
        param: 'initialDistribution',
        label: 'Start',
        options: [
          { value: 'uniform', label: 'Uniform' },
          { value: 'bimodal', label: 'Bimodal' },
          { value: 'clustered', label: 'Clustered' },
        ],
      },
    ],
  },
  {
    label: 'Dynamics',
    controls: [
      {
        type: 'range',
        param: 'tolerance',
        label: 'Tolerance',
        min: 0.05,
        max: 1.0,
        step: 0.05,
        format: (v) => v.toFixed(2),
      },
      {
        type: 'range',
        param: 'influenceStrength',
        label: 'Influence',
        min: 0.01,
        max: 0.3,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        type: 'range',
        param: 'interactionRadius',
        label: 'Interaction radius',
        min: 20,
        max: 200,
        step: 10,
      },
    ],
  },
];

export function OpinionDynamicsDemo() {
  return (
    <Simulation sim={opinionDynamicsSim} delayMs={50} autoplay>
      <DemoSplit
        preview={<OpinionCanvas />}
        controls={
          <DemoControlPanel
            groups={GROUPS}
            extra={<OpinionStats />}
            showStep
          />
        }
      />
    </Simulation>
  );
}

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
import { opinionDynamicsPalette } from '../theme/palette';
import styles from './OpinionDynamicsDemo.module.css';

const CSS_SIZE = 600;

/** Diverging color scale: blue (0) -> light (0.5) -> red (1). */
function opinionColor(o: number): string {
  if (o < 0.5) {
    const t = o * 2;
    const r = Math.floor(
      opinionDynamicsPalette.lowR0 + t * opinionDynamicsPalette.lowRDelta,
    );
    const g = Math.floor(
      opinionDynamicsPalette.lowG0 + t * opinionDynamicsPalette.lowGDelta,
    );
    const b = Math.floor(
      opinionDynamicsPalette.lowB0 + t * opinionDynamicsPalette.lowBDelta,
    );
    return `rgb(${r},${g},${b})`;
  }
  const t = (o - 0.5) * 2;
  const r = Math.floor(
    opinionDynamicsPalette.highR0 - t * opinionDynamicsPalette.highRDelta,
  );
  const g = Math.floor(
    opinionDynamicsPalette.highG0 - t * opinionDynamicsPalette.highGDelta,
  );
  const b = Math.floor(
    opinionDynamicsPalette.highB0 - t * opinionDynamicsPalette.highBDelta,
  );
  return `rgb(${r},${g},${b})`;
}

function OpinionCanvas() {
  const canvasRef = useSimulationCanvas<typeof opinionDynamicsSim>(
    (ctx, { data }, view) => {
      const scale = CSS_SIZE / data.worldSize;

      view.clear(view.theme('--bg3', opinionDynamicsPalette.bgFallback));

      for (const a of data.agents) {
        ctx.fillStyle = opinionColor(a.opinion);
        ctx.beginPath();
        ctx.arc(a.x * scale, a.y * scale, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { width: CSS_SIZE, height: CSS_SIZE },
  );

  return (
    <div className={styles.stage}>
      <CanvasStage maxWidth={CSS_SIZE}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </CanvasStage>
      <div className={styles.chartWrap}>
        <TimeSeries<OpinionData> mode='line' height={130} series={SERIES} />
      </div>
    </div>
  );
}

const SERIES: TimeSeriesEntry<OpinionData>[] = [
  {
    color: opinionDynamicsPalette.polarizationSeries,
    label: 'Polarization ×1000',
    accessor: (d) => d.polarization * 1000,
  },
  {
    color: opinionDynamicsPalette.clustersSeries,
    label: 'Clusters',
    accessor: (d) => d.clusters,
  },
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
          <span className={styles.value}>{data.averageOpinion.toFixed(3)}</span>
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
          <DemoControlPanel groups={GROUPS} extra={<OpinionStats />} showStep />
        }
      />
    </Simulation>
  );
}

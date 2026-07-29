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
import sugarscapeSim from '../sims/sugarscapeSim';
import type { SugarscapeData } from '../sims/sugarscapeSim';
import { sugarscapePalette } from '../theme/palette';
import styles from './SugarscapeDemo.module.css';

const CSS_SIZE = 600;
const MAX_CAPACITY = 4;

function SugarscapeCanvas() {
  const canvasRef = useSimulationCanvas<typeof sugarscapeSim>(
    (ctx, { data }, view) => {
      const w = data.width;
      const h = data.height;

      // Sugar field: dark background, golden where sugar is plentiful.
      view.blitGrid(w, h, (px) => {
        for (let i = 0; i < w * h; i++) {
          const t = Math.min(1, data.sugarGrid[i] / MAX_CAPACITY);
          const j = i * 4;
          px[j] = Math.floor(sugarscapePalette.fieldR0 + t * sugarscapePalette.fieldRScale);
          px[j + 1] = Math.floor(sugarscapePalette.fieldG0 + t * sugarscapePalette.fieldGScale);
          px[j + 2] = Math.floor(sugarscapePalette.fieldB0 + t * sugarscapePalette.fieldBScale);
          px[j + 3] = sugarscapePalette.fieldAlpha;
        }
      });

      // Agents as dots colored by wealth (red = poor, green = rich).
      const cell = CSS_SIZE / w;
      const r = Math.max(1.4, cell * 0.38);
      for (const a of data.agents) {
        const wealth = Math.min(1, a.sugar / 30);
        const cr = Math.floor(sugarscapePalette.poorR0 - wealth * sugarscapePalette.wealthRDelta);
        const cg = Math.floor(sugarscapePalette.poorG0 + wealth * sugarscapePalette.wealthGDelta);
        ctx.fillStyle = `rgb(${cr},${cg},${sugarscapePalette.agentB})`;
        ctx.beginPath();
        ctx.arc((a.x + 0.5) * cell, (a.y + 0.5) * cell, r, 0, Math.PI * 2);
        ctx.fill();
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
        <TimeSeries<SugarscapeData>
          mode='line'
          height={130}
          series={SUGAR_SERIES}
        />
      </div>
    </div>
  );
}

const SUGAR_SERIES: TimeSeriesEntry<SugarscapeData>[] = [
  { color: sugarscapePalette.populationSeries, label: 'Population', accessor: (d) => d.aliveCount },
  {
    color: sugarscapePalette.giniSeries,
    label: 'Gini ×100',
    accessor: (d) => d.giniCoefficient * 100,
  },
];

function WealthStats() {
  const { data } = useSimulation<typeof sugarscapeSim>();
  return (
    <div className='group'>
      <div className='g-lbl'>Status</div>
      <div className={styles.stats}>
        <div className={styles.row}>
          <span className={styles.label}>population</span>
          <span className={styles.value}>{data.aliveCount}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>gini</span>
          <span className={styles.value}>
            {data.giniCoefficient.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}

const SUGAR_GROUPS: DemoControlGroup[] = [
  {
    label: 'World (resets)',
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
        type: 'range',
        param: 'sugarGrowbackRate',
        label: 'Sugar growback',
        min: 0.1,
        max: 2,
        step: 0.1,
      },
    ],
  },
  {
    label: 'Agents (resets)',
    controls: [
      {
        type: 'range',
        param: 'maxMetabolism',
        label: 'Max metabolism',
        min: 1,
        max: 8,
        step: 1,
      },
      {
        type: 'range',
        param: 'maxVision',
        label: 'Max vision',
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
];

export function SugarscapeDemo() {
  return (
    <Simulation sim={sugarscapeSim} delayMs={50} autoplay>
      <DemoSplit
        preview={<SugarscapeCanvas />}
        controls={
          <DemoControlPanel
            groups={SUGAR_GROUPS}
            extra={<WealthStats />}
            showStep
          />
        }
      />
    </Simulation>
  );
}

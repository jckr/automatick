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
import { TimeSeries, TimeSeriesEntry } from '../components/TimeSeries';
import epidemicSim from '../sims/epidemicSim';
import type { EpidemicData, EpidemicParams } from '../sims/epidemicSim';
import { epidemicPalette } from '../theme/palette';
import styles from './EpidemicDemo.module.css';

const STATUS_COLORS: Record<string, string> = {
  healthy: epidemicPalette.status.healthy,
  sick: epidemicPalette.status.sick,
  recovered: epidemicPalette.status.recovered,
  dead: epidemicPalette.status.dead,
};

function EpidemicCanvas() {
  const { setParams, resetWith } = useSimulation<typeof epidemicSim>();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);
  // Ownership mode needs the logical canvas size up front: track the
  // wrapper's measured size in state so the hook re-attaches on resize.
  const [size, setSize] = React.useState({ width: 332, height: 332 });

  const canvasRef = useSimulationCanvas<typeof epidemicSim>((ctx, { data, params }, view) => {
    view.clear(view.theme('--bg3', epidemicPalette.bgFallback));

    data.agents.forEach((agent) => {
      ctx.fillStyle = STATUS_COLORS[agent.status] ?? epidemicPalette.unknown;
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, params.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }, size);

  // Track the wrapper size; resize the canvas (via ownership mode) and the
  // sim's world bounds so agents bounce against the visible edges.
  React.useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;

    const apply = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      setSize({ width: w, height: h });
      if (!initializedRef.current) {
        initializedRef.current = true;
        resetWith({ width: w, height: h } as Partial<EpidemicParams>);
      } else {
        setParams({ width: w, height: h } as Partial<EpidemicParams>);
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [setParams, resetWith]);

  return (
    <div className={styles.stage}>
      <div ref={wrapperRef} className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.perf}>
          <PerformanceOverlay />
        </div>
      </div>
      <div className={styles.chartWrap}>
        <TimeSeries<EpidemicData>
          mode='area'
          height={120}
          series={EPIDEMIC_SERIES}
        />
      </div>
    </div>
  );
}

const EPIDEMIC_SERIES: TimeSeriesEntry<EpidemicData>[] = [
  { color: STATUS_COLORS.healthy, label: 'Healthy', accessor: (d) => d.healthy },
  { color: STATUS_COLORS.sick, label: 'Sick', accessor: (d) => d.sick },
  {
    color: STATUS_COLORS.recovered,
    label: 'Recovered',
    accessor: (d) => d.recovered,
  },
  { color: STATUS_COLORS.dead, label: 'Dead', accessor: (d) => d.dead },
];

const EPIDEMIC_GROUPS: DemoControlGroup[] = [
  {
    label: 'Population',
    controls: [
      {
        type: 'range',
        param: 'nbAgents',
        label: 'Agents',
        min: 50,
        max: 400,
        step: 10,
      },
      {
        type: 'range',
        param: 'nbSick',
        label: 'Initially sick',
        min: 1,
        max: 50,
        step: 1,
      },
      {
        type: 'range',
        param: 'nbDistancing',
        label: 'Distancing',
        min: 0,
        max: 200,
        step: 10,
      },
    ],
  },
  {
    label: 'Disease',
    controls: [
      {
        type: 'range',
        param: 'contaminationRisk',
        label: 'Contamination',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        type: 'range',
        param: 'deathRisk',
        label: 'Death risk',
        min: 0,
        max: 0.01,
        step: 0.0001,
        format: (v) => v.toFixed(4),
      },
      {
        type: 'range',
        param: 'recoveryTicks',
        label: 'Recovery ticks',
        min: 50,
        max: 500,
        step: 10,
      },
    ],
  },
  {
    label: 'Movement',
    controls: [
      {
        type: 'range',
        param: 'maxSpeed',
        label: 'Max speed',
        min: 1,
        max: 15,
        step: 1,
      },
    ],
  },
];

export function EpidemicDemo() {
  return (
    <Simulation sim={epidemicSim} maxTime={5000} delayMs={50}>
      <DemoSplit
        preview={<EpidemicCanvas />}
        controls={<DemoControlPanel groups={EPIDEMIC_GROUPS} />}
      />
    </Simulation>
  );
}

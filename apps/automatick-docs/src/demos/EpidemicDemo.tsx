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

const STATUS_COLORS: Record<string, string> = {
  healthy: '#3D6B4B',
  sick: '#D7451E',
  recovered: '#8A8A8A',
  dead: '#0E1116',
};

function EpidemicCanvas() {
  const { setParams, resetWith } = useSimulation<typeof epidemicSim>();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);

  const canvasRef = useSimulationCanvas<typeof epidemicSim>((ctx, { data, params }) => {
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--bg3').trim() || '#E6E0D0';
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, params.width, params.height);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, params.width, params.height);

    data.agents.forEach((agent) => {
      ctx.fillStyle = STATUS_COLORS[agent.status] ?? '#999';
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, params.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  // Track the wrapper size; resize the canvas framebuffer and the sim's
  // world bounds so agents bounce against the visible edges.
  React.useEffect(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const apply = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
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
  }, [canvasRef, setParams, resetWith]);

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        minHeight: 540,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <PerformanceOverlay />
        </div>
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
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

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
import epidemicSim from '../sims/epidemicSim';

const CSS_SIZE = 600;

const STATUS_COLORS: Record<string, string> = {
  healthy: '#3D6B4B',
  sick: '#D7451E',
  recovered: '#8A8A8A',
  dead: '#0E1116',
};

function EpidemicCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const canvasRef = useSimulationCanvas<typeof epidemicSim>((ctx, { data, params }) => {
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--bg3').trim() || '#E6E0D0';
    const scale = (CSS_SIZE * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
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

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        minHeight: 540,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CSS_SIZE * dpr}
        height={CSS_SIZE * dpr}
        style={{
          width: '100%',
          maxWidth: CSS_SIZE,
          height: 'auto',
          display: 'block',
        }}
      />
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <PerformanceOverlay />
      </div>
    </div>
  );
}

function EpidemicStats() {
  const { data } = useSimulation<typeof epidemicSim>();
  if (!data) return null;
  const counts = [
    { label: 'Healthy', value: data.healthy, color: STATUS_COLORS.healthy },
    { label: 'Sick', value: data.sick, color: STATUS_COLORS.sick },
    { label: 'Recovered', value: data.recovered, color: STATUS_COLORS.recovered },
    { label: 'Dead', value: data.dead, color: STATUS_COLORS.dead },
  ];
  const total = data.healthy + data.sick + data.recovered + data.dead;

  return (
    <div className='group'>
      <div className='g-lbl'>Population</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      >
        {counts.map(({ label, value, color }) => (
          <div
            key={label}
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <span style={{ color }}>{label.toLowerCase()}</span>
            <span style={{ color: 'var(--fg1)' }}>{value}</span>
          </div>
        ))}
        {total > 0 && (
          <div
            style={{
              display: 'flex',
              height: 6,
              borderRadius: 2,
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            {counts.map(({ label, value, color }) =>
              value > 0 ? (
                <div
                  key={label}
                  style={{
                    width: `${(value / total) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
        max: 0.05,
        step: 0.001,
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
        controls={
          <DemoControlPanel groups={EPIDEMIC_GROUPS} extra={<EpidemicStats />} />
        }
      />
    </Simulation>
  );
}

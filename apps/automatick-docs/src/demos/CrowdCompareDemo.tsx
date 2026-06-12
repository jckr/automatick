import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { TimeSeries, TimeSeriesEntry } from '../components/TimeSeries';
import crowdCompareSim from '../sims/crowdCompareSim';
import type { CrowdCompareData } from '../sims/crowdCompareSim';
import styles from './CrowdCompareDemo.module.css';

const PANEL = 300; // each world is drawn into a PANEL×PANEL square
const GROUP_COLORS = ['#3b82f6', '#e8612c', '#22c55e', '#a855f7'];
const OBSTACLE_FILL = '#39414f';
const SELFISH_COLOR = '#d9534f';
const COORD_COLOR = '#41a36a';

function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: CrowdCompareData['selfish'],
  obstacles: CrowdCompareData['obstacles'],
  offsetX: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(offsetX, 0);

  ctx.fillStyle = OBSTACLE_FILL;
  for (const o of obstacles) {
    ctx.fillRect(o.x * scale, o.y * scale, o.w * scale, o.h * scale);
  }
  for (const a of world.agents) {
    ctx.fillStyle = GROUP_COLORS[a.group] ?? GROUP_COLORS[0];
    ctx.beginPath();
    ctx.arc(a.x * scale, a.y * scale, a.radius * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function CrowdCompareCanvas() {
  const canvasRef = useSimulationCanvas<typeof crowdCompareSim>(
    (ctx, { data }, view) => {
      const scale = PANEL / data.width;
      view.clear(view.theme('--bg3', '#1b1f27'));

      drawWorld(ctx, data.selfish, data.obstacles, 0, scale);
      drawWorld(ctx, data.coordinated, data.obstacles, PANEL, scale);

      // Divider + labels.
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PANEL, 0);
      ctx.lineTo(PANEL, PANEL);
      ctx.stroke();

      ctx.font = '600 12px var(--font-mono, monospace)';
      ctx.textBaseline = 'top';
      ctx.fillStyle = SELFISH_COLOR;
      ctx.fillText(`Selfish · ${data.selfish.completed}`, 8, 8);
      ctx.fillStyle = COORD_COLOR;
      ctx.fillText(`Coordinated · ${data.coordinated.completed}`, PANEL + 8, 8);
    },
    { width: PANEL * 2, height: PANEL }
  );

  return (
    <div className={styles.stage}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.chartWrap}>
        <TimeSeries<CrowdCompareData>
          mode='line'
          height={130}
          series={COMPARE_SERIES}
        />
      </div>
    </div>
  );
}

const COMPARE_SERIES: TimeSeriesEntry<CrowdCompareData>[] = [
  { color: SELFISH_COLOR, label: 'Selfish arrivals', accessor: (d) => d.selfish.completed },
  { color: COORD_COLOR, label: 'Coordinated arrivals', accessor: (d) => d.coordinated.completed },
];

// Switching scenario rebuilds both worlds; re-init and keep playing.
function ScenarioSync() {
  const { params, resetWith, play } = useSimulation<typeof crowdCompareSim>();
  const prev = React.useRef(params.scenario);
  React.useEffect(() => {
    if (prev.current !== params.scenario) {
      prev.current = params.scenario;
      resetWith();
      play();
    }
  }, [params.scenario, resetWith, play]);
  return null;
}

const COMPARE_GROUPS: DemoControlGroup[] = [
  {
    label: 'Scenario',
    controls: [
      {
        type: 'chips',
        param: 'scenario',
        label: 'Layout',
        options: [
          { value: 'bidirectional', label: 'Corridor' },
          { value: 'bottleneck', label: 'Bottleneck' },
          { value: 'counterflow', label: 'Counterflow' },
          { value: 'crossing', label: 'Crossing' },
          { value: 'fourway', label: 'Four-way' },
        ],
      },
      {
        type: 'range',
        param: 'numAgents',
        label: 'Agents (each)',
        min: 20,
        max: 300,
        step: 10,
      },
    ],
  },
  {
    label: 'Behavior',
    controls: [
      {
        type: 'range',
        param: 'personalSpace',
        label: 'Personal space',
        min: 6,
        max: 24,
        step: 1,
      },
      {
        type: 'range',
        param: 'desiredSpeed',
        label: 'Desired speed',
        min: 0.5,
        max: 3,
        step: 0.25,
        format: (v) => v.toFixed(2),
      },
    ],
  },
];

export function CrowdCompareDemo() {
  return (
    <Simulation sim={crowdCompareSim} delayMs={16} autoplay>
      <ScenarioSync />
      <DemoSplit
        preview={<CrowdCompareCanvas />}
        controls={<DemoControlPanel groups={COMPARE_GROUPS} showStep />}
      />
    </Simulation>
  );
}

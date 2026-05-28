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
import crowdSim from '../sims/crowdSim';
import styles from './CrowdDemo.module.css';

const CSS_SIZE = 600;
const GROUP_COLORS = ['#3b82f6', '#e8612c']; // 0 = blue (→), 1 = orange (←/↓)
const OBSTACLE_FILL = '#39414f';

function CrowdCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const canvasRef = useSimulationCanvas<typeof crowdSim>((ctx, { data }) => {
    const scale = CSS_SIZE / data.width;
    const cssStyles = getComputedStyle(document.documentElement);
    const bg = cssStyles.getPropertyValue('--bg3').trim() || '#1b1f27';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CSS_SIZE, CSS_SIZE);

    // Obstacles (walls).
    ctx.fillStyle = OBSTACLE_FILL;
    for (const o of data.obstacles) {
      ctx.fillRect(o.x * scale, o.y * scale, o.w * scale, o.h * scale);
    }

    // Agents — colored by travel group, with a short heading whisker.
    for (const a of data.agents) {
      const cx = a.x * scale;
      const cy = a.y * scale;
      const r = a.radius * scale;
      ctx.fillStyle = GROUP_COLORS[a.group] ?? GROUP_COLORS[0];
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      const sp = Math.hypot(a.vx, a.vy);
      if (sp > 0.05) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (a.vx / sp) * r * 1.8, cy + (a.vy / sp) * r * 1.8);
        ctx.stroke();
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas
        ref={canvasRef}
        width={CSS_SIZE * dpr}
        height={CSS_SIZE * dpr}
        className={styles.canvas}
      />
    </CanvasStage>
  );
}

// Changing the scenario rebuilds obstacles + spawn layout, so re-init and
// keep playing when the chips selection changes.
function ScenarioSync() {
  const { params, resetWith, play } = useSimulation<typeof crowdSim>();
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

const CROWD_GROUPS: DemoControlGroup[] = [
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
          { value: 'crossing', label: 'Crossing' },
        ],
      },
      {
        type: 'range',
        param: 'numAgents',
        label: 'Agents',
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

export function CrowdDemo() {
  return (
    <Simulation sim={crowdSim} delayMs={16} autoplay>
      <ScenarioSync />
      <DemoSplit
        preview={<CrowdCanvas />}
        controls={<DemoControlPanel groups={CROWD_GROUPS} showStep />}
      />
    </Simulation>
  );
}

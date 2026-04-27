import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { PerformanceOverlay } from 'automatick/react/performance';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import activatorsSim from '../sims/activatorsSim';

const CELL_PX = 10;
const CSS_SIZE = 600;

function ActivatorsCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const canvasRef = useSimulationCanvas<typeof activatorsSim>((ctx, { data, params }) => {
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--fg1').trim() || '#0E1116';
    const bg = styles.getPropertyValue('--bg3').trim() || '#E6E0D0';

    const simW = params.width * CELL_PX;
    const scale = (CSS_SIZE * dpr) / simW;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, params.width * CELL_PX, params.height * CELL_PX);

    for (let row = 0; row < data.grid.length; row++) {
      for (let col = 0; col < data.grid[row].length; col++) {
        ctx.fillStyle = data.grid[row][col] ? ink : bg;
        ctx.fillRect(col * CELL_PX, row * CELL_PX, CELL_PX, CELL_PX);
      }
    }

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

const ACTIVATORS_GROUPS: DemoControlGroup[] = [
  {
    label: 'Radii',
    controls: [
      {
        type: 'range',
        param: 'innerRadius',
        label: 'Inner',
        min: 1,
        max: 10,
        step: 1,
      },
      {
        type: 'range',
        param: 'outerRadius',
        label: 'Outer',
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
  {
    label: 'Field',
    controls: [
      {
        type: 'range',
        param: 'w',
        label: 'Weight',
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'density',
        label: 'Density',
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
];

export function ActivatorsDemo() {
  return (
    <Simulation sim={activatorsSim} maxTime={200} delayMs={100}>
      <DemoSplit
        preview={<ActivatorsCanvas />}
        controls={<DemoControlPanel groups={ACTIVATORS_GROUPS} showStep />}
      />
    </Simulation>
  );
}

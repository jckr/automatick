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
import { themeFallback } from '../theme/palette';
import styles from './ActivatorsDemo.module.css';

const CELL_PX = 10;
const CSS_SIZE = 600;

function ActivatorsCanvas() {
  const canvasRef = useSimulationCanvas<typeof activatorsSim>(
    (ctx, { data, params }, view) => {
      const ink = view.theme('--fg1', themeFallback.fg1Light);
      const bg = view.theme('--bg3', themeFallback.bg3Light);

      view.clear();
      // Draw in sim coordinates (cells of CELL_PX) scaled to the canvas.
      const scale = CSS_SIZE / (params.width * CELL_PX);
      ctx.save();
      ctx.scale(scale, scale);

      for (let row = 0; row < data.grid.length; row++) {
        for (let col = 0; col < data.grid[row].length; col++) {
          ctx.fillStyle = data.grid[row][col] ? ink : bg;
          ctx.fillRect(col * CELL_PX, row * CELL_PX, CELL_PX, CELL_PX);
        }
      }

      ctx.restore();
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <div className={styles.stage}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.perf}>
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

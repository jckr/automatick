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
import percolationSim, {
  ROCK,
  WATER_FROM_TOP,
  WATER_FROM_LEFT,
  WATER_FROM_RIGHT,
} from '../sims/percolationSim';

const CELL_PX = 6;
const CSS_SIZE = 600;

function cellColor(cell: number): string {
  if (cell === ROCK) return '#555';
  if (
    cell === WATER_FROM_TOP ||
    cell === WATER_FROM_LEFT ||
    cell === WATER_FROM_RIGHT
  ) {
    return '#38bdf8';
  }
  return '#f0ebe3';
}

function PercolationGrid() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const { data } = useSimulation<typeof percolationSim>();

  const borderColor =
    data.result === 'success'
      ? 'var(--info)'
      : data.result === 'failure'
        ? 'var(--fg3)'
        : 'transparent';

  const canvasRef = useSimulationCanvas<typeof percolationSim>((ctx, { data, params }) => {
    const simW = params.width * CELL_PX;
    const simH = params.height * CELL_PX;
    const scaleX = (CSS_SIZE * dpr) / simW;
    const scaleY = (CSS_SIZE * dpr) / simH;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    ctx.fillStyle = '#f0ebe3';
    ctx.fillRect(0, 0, simW, simH);

    for (let y = 0; y < data.grid.length; y++) {
      const row = data.grid[y];
      for (let x = 0; x < row.length; x++) {
        const color = cellColor(row[x]);
        if (color !== '#f0ebe3') {
          ctx.fillStyle = color;
          ctx.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX, CELL_PX);
        }
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
      <div
        style={{
          width: '100%',
          maxWidth: CSS_SIZE,
          border: `3px solid ${borderColor}`,
          borderRadius: 4,
          lineHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CSS_SIZE * dpr}
          height={CSS_SIZE * dpr}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <PerformanceOverlay />
      </div>
    </div>
  );
}

const PERC_GROUPS: DemoControlGroup[] = [
  {
    label: 'Lattice',
    controls: [
      {
        type: 'range',
        param: 'porosity',
        label: 'Porosity',
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'width',
        label: 'Width',
        min: 10,
        max: 100,
        step: 1,
      },
      {
        type: 'range',
        param: 'height',
        label: 'Height',
        min: 10,
        max: 100,
        step: 1,
      },
    ],
  },
];

export function PercolationDemo() {
  return (
    <Simulation sim={percolationSim} maxTime={Infinity} delayMs={30}>
      <DemoSplit
        preview={<PercolationGrid />}
        controls={<DemoControlPanel groups={PERC_GROUPS} showStep />}
      />
    </Simulation>
  );
}

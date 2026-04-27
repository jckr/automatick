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
import percolationGridSim from '../sims/percolationGridSim';
import {
  ROCK,
  WATER_FROM_TOP,
  WATER_FROM_LEFT,
  WATER_FROM_RIGHT,
} from '../sims/percolationSim';

const CELL_PX = 3;
const GAP = 6;
const HEADER_H = 22;
const FOOTER_H = 26;

function cellColor(cell: number): string {
  if (cell === ROCK) return '#777';
  if (
    cell === WATER_FROM_TOP ||
    cell === WATER_FROM_LEFT ||
    cell === WATER_FROM_RIGHT
  ) {
    return '#38bdf8';
  }
  return '#f0ebe3';
}

function GridCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const { params } = useSimulation<typeof percolationGridSim>();

  const miniW = params.width * CELL_PX;
  const miniH = params.height * CELL_PX;
  const cssW = params.cols * miniW + (params.cols - 1) * GAP;
  const cssH = HEADER_H + params.rows * miniH + (params.rows - 1) * GAP + FOOTER_H;

  const canvasRef = useSimulationCanvas<typeof percolationGridSim>(
    (ctx, { data }) => {
      const styles = getComputedStyle(document.documentElement);
      const fg1 = styles.getPropertyValue('--fg1').trim() || '#0E1116';
      const fg3 = styles.getPropertyValue('--fg3').trim() || '#5B6070';
      const success = styles.getPropertyValue('--info').trim() || '#2B6E8F';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Column headers (porosity values)
      ctx.font = '10px var(--font-mono, monospace)';
      ctx.textAlign = 'center';
      ctx.fillStyle = fg3;
      data.colsMeta.forEach((c, ci) => {
        const cx = ci * (miniW + GAP) + miniW / 2;
        ctx.fillText(c.p.toFixed(2), cx, 13);
      });

      // Mini-grid bodies
      for (let r = 0; r < params.rows; r++) {
        for (let c = 0; c < params.cols; c++) {
          const baseX = c * (miniW + GAP);
          const baseY = HEADER_H + r * (miniH + GAP);
          const cell = data.cells[r][c];
          ctx.fillStyle = '#f0ebe3';
          ctx.fillRect(baseX, baseY, miniW, miniH);
          const grid = cell.grid;
          for (let y = 0; y < grid.length; y++) {
            const row = grid[y];
            for (let x = 0; x < row.length; x++) {
              const v = row[x];
              const color = cellColor(v);
              if (color === '#f0ebe3') continue;
              ctx.fillStyle = color;
              ctx.fillRect(
                baseX + x * CELL_PX,
                baseY + y * CELL_PX,
                CELL_PX,
                CELL_PX
              );
            }
          }
          // 1px outline tinted by result for finished runs.
          if (cell.result !== 'pending') {
            ctx.strokeStyle = cell.result === 'success' ? success : 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 1;
            ctx.strokeRect(baseX + 0.5, baseY + 0.5, miniW - 1, miniH - 1);
          }
        }
      }

      // Column footers (success/total). Ratio also shown as a thin filled bar.
      const footerTop = HEADER_H + params.rows * miniH + (params.rows - 1) * GAP + 6;
      ctx.fillStyle = fg1;
      ctx.font = '10px var(--font-mono, monospace)';
      ctx.textAlign = 'center';
      data.colsMeta.forEach((c, ci) => {
        const cx = ci * (miniW + GAP) + miniW / 2;
        const ratio = c.total ? c.result / c.total : 0;
        // background bar
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(ci * (miniW + GAP), footerTop, miniW, 3);
        // filled bar
        ctx.fillStyle = success;
        ctx.fillRect(ci * (miniW + GAP), footerTop, miniW * ratio, 3);
        // text
        ctx.fillStyle = fg1;
        ctx.fillText(`${c.result}/${c.total}`, cx, footerTop + 14);
      });

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  );

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
        width={cssW * dpr}
        height={cssH * dpr}
        style={{
          width: cssW,
          maxWidth: '100%',
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

const PG_GROUPS: DemoControlGroup[] = [
  {
    label: 'Sweep',
    controls: [
      {
        type: 'range',
        param: 'minP',
        label: 'Min porosity',
        min: 0.4,
        max: 0.7,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'stepP',
        label: 'Step',
        min: 0.005,
        max: 0.05,
        step: 0.005,
      },
    ],
  },
];

export function PercolationGridDemo() {
  return (
    <Simulation sim={percolationGridSim} delayMs={20} autoplay>
      <DemoSplit
        preview={<GridCanvas />}
        controls={<DemoControlPanel groups={PG_GROUPS} showStep />}
      />
    </Simulation>
  );
}

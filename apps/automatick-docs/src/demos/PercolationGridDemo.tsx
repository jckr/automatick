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
import { percolationGridPalette } from '../theme/palette';
import styles from './PercolationGridDemo.module.css';

const CELL_PX = 3;
const GAP = 6;
const HEADER_H = 22;
const FOOTER_H = 26;

function cellColor(cell: number): string {
  if (cell === ROCK) return percolationGridPalette.rock;
  if (
    cell === WATER_FROM_TOP ||
    cell === WATER_FROM_LEFT ||
    cell === WATER_FROM_RIGHT
  ) {
    return percolationGridPalette.water;
  }
  return percolationGridPalette.open;
}

function GridCanvas() {
  const { params } = useSimulation<typeof percolationGridSim>();

  const miniW = params.width * CELL_PX;
  const miniH = params.height * CELL_PX;
  const cssW = params.cols * miniW + (params.cols - 1) * GAP;
  const cssH = HEADER_H + params.rows * miniH + (params.rows - 1) * GAP + FOOTER_H;

  const canvasRef = useSimulationCanvas<typeof percolationGridSim>(
    (ctx, { data }, view) => {
      const fg1 = view.theme('--fg1', percolationGridPalette.fg1Fallback);
      const fg3 = view.theme('--fg3', percolationGridPalette.fg3Fallback);
      const success = view.theme(
        '--info',
        percolationGridPalette.successFallback,
      );

      view.clear();

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
          ctx.fillStyle = percolationGridPalette.open;
          ctx.fillRect(baseX, baseY, miniW, miniH);
          const grid = cell.grid;
          for (let y = 0; y < grid.length; y++) {
            const row = grid[y];
            for (let x = 0; x < row.length; x++) {
              const v = row[x];
              const color = cellColor(v);
              if (color === percolationGridPalette.open) continue;
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
            ctx.strokeStyle =
              cell.result === 'success'
                ? success
                : percolationGridPalette.failureOutline;
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
        ctx.fillStyle = percolationGridPalette.footerBar;
        ctx.fillRect(ci * (miniW + GAP), footerTop, miniW, 3);
        // filled bar
        ctx.fillStyle = success;
        ctx.fillRect(ci * (miniW + GAP), footerTop, miniW * ratio, 3);
        // text
        ctx.fillStyle = fg1;
        ctx.fillText(`${c.result}/${c.total}`, cx, footerTop + 14);
      });
    },
    { width: cssW, height: cssH }
  );

  return (
    <div className={styles.stage}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width: cssW }}
      />
      <div className={styles.perf}>
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

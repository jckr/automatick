import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import xorRingSim from '../sims/xorRingSim';
import { workerCanvasPalette } from '../theme/palette';
import styles from './WorkerCanvasDemo.module.css';

const ROW_HEIGHT = 1;
const MAX_ROWS = 200;
const CSS_WIDTH = 600;
const CSS_HEIGHT = 500;

function XorRingCanvas() {
  const historyRef = React.useRef<number[][]>([]);
  const lastTickRef = React.useRef(-1);

  const canvasRef = useSimulationCanvas<typeof xorRingSim>(
    (ctx, { data, params, tick }, view) => {
      const ink = view.theme('--fg1', workerCanvasPalette.inkFallback);
      const bg = view.theme('--bg2', workerCanvasPalette.bgFallback);

      if (tick === 0) {
        historyRef.current = [];
        lastTickRef.current = -1;
      }

      if (tick > lastTickRef.current) {
        historyRef.current.push([...data]);
        lastTickRef.current = tick;
      }
      if (historyRef.current.length > MAX_ROWS) {
        historyRef.current = historyRef.current.slice(-MAX_ROWS);
      }

      const { cells } = params;
      const simW = cells;
      const simH = MAX_ROWS * ROW_HEIGHT;
      ctx.save();
      ctx.scale(view.width / simW, view.height / simH);

      const rows = historyRef.current;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, simW, simH);
      ctx.fillStyle = ink;
      rows.forEach((row, rowIdx) => {
        for (let i = 0; i < cells; i++) {
          if (row[i]) ctx.fillRect(i, rowIdx * ROW_HEIGHT, 1, ROW_HEIGHT);
        }
      });
      ctx.restore();
    },
    { width: CSS_WIDTH, height: CSS_HEIGHT }
  );

  return (
    <CanvasStage maxWidth={CSS_WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const XOR_GROUPS: DemoControlGroup[] = [
  {
    label: 'Ring',
    controls: [
      {
        type: 'range',
        param: 'cells',
        label: 'Cells',
        min: 50,
        max: 500,
        step: 10,
      },
      {
        type: 'range',
        param: 'density',
        label: 'Initial density',
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
];

export function WorkerCanvasDemo() {
  return (
    <Simulation sim={xorRingSim} maxTime={5000} delayMs={50}>
      <DemoSplit
        preview={<XorRingCanvas />}
        controls={<DemoControlPanel groups={XOR_GROUPS} showStep />}
      />
    </Simulation>
  );
}

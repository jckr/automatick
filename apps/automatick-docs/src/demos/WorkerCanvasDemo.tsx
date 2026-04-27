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

const ROW_HEIGHT = 1;
const MAX_ROWS = 200;
const CSS_WIDTH = 600;
const CSS_HEIGHT = 500;

function XorRingCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const historyRef = React.useRef<number[][]>([]);
  const lastTickRef = React.useRef(-1);

  const canvasRef = useSimulationCanvas<typeof xorRingSim>((ctx, { data, params, tick }) => {
    if (!data) return;
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--fg1').trim() || '#0E1116';
    const bg = styles.getPropertyValue('--bg2').trim() || '#EFEADD';

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
    const scaleX = (CSS_WIDTH * dpr) / simW;
    const scaleY = (CSS_HEIGHT * dpr) / simH;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    const rows = historyRef.current;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, simW, simH);
    ctx.fillStyle = ink;
    rows.forEach((row, rowIdx) => {
      for (let i = 0; i < cells; i++) {
        if (row[i]) ctx.fillRect(i, rowIdx * ROW_HEIGHT, 1, ROW_HEIGHT);
      }
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <CanvasStage maxWidth={CSS_WIDTH}>
      <canvas
        ref={canvasRef}
        width={CSS_WIDTH * dpr}
        height={CSS_HEIGHT * dpr}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 4,
          imageRendering: 'pixelated',
        }}
      />
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

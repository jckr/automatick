import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import langtonAntSim from '../sims/langtonAntSim';
import styles from './LangtonAntDemo.module.css';

const CSS_SIZE = 600;

function LangtonCanvas() {
  const canvasRef = useSimulationCanvas<typeof langtonAntSim>(
    (ctx, { data }, view) => {
      const { gridWidth: gw, gridHeight: gh, cells, antX, antY } = data;
      const cellW = view.width / gw;
      const cellH = view.height / gh;

      view.clear(view.theme('--bg2', '#EFEADD'));

      ctx.fillStyle = view.theme('--fg1', '#0E1116');
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          if (cells[y * gw + x]) {
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }
        }
      }

      ctx.fillStyle = view.theme('--accent', '#D7451E');
      ctx.fillRect(antX * cellW, antY * cellH, cellW, cellH);
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

export function LangtonAntDemo() {
  return (
    <Simulation sim={langtonAntSim} maxTime={50000} delayMs={0} ticksPerFrame={10}>
      <DemoSplit
        preview={<LangtonCanvas />}
        controls={<DemoControlPanel groups={[]} showStep />}
      />
    </Simulation>
  );
}

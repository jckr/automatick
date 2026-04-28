import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import langtonAntSim from '../sims/langtonAntSim';

const CSS_SIZE = 600;

function LangtonCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const canvasRef = useSimulationCanvas<typeof langtonAntSim>((ctx, { data, params }) => {
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--fg1').trim() || '#0E1116';
    const bg = styles.getPropertyValue('--bg2').trim() || '#EFEADD';
    const accent = styles.getPropertyValue('--accent').trim() || '#D7451E';

    const scale = (CSS_SIZE * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const { gridWidth: gw, gridHeight: gh, cells, antX, antY } = data;
    const cellW = params.width / gw;
    const cellH = params.height / gh;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, params.width, params.height);

    ctx.fillStyle = ink;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        if (cells[y * gw + x]) {
          ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
        }
      }
    }

    ctx.fillStyle = accent;
    ctx.fillRect(antX * cellW, antY * cellH, cellW, cellH);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas
        ref={canvasRef}
        width={CSS_SIZE * dpr}
        height={CSS_SIZE * dpr}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
      />
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

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import fibonacciSpiralSim, {
  drawFibonacciSpiral,
} from '../sims/fibonacciSpiralSim';

const SIZE = 600;

function SpiralCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const canvasRef = useSimulationCanvas<typeof fibonacciSpiralSim>((ctx, { params, tick }) => {
    const scale = (SIZE * dpr) / params.size;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawFibonacciSpiral(ctx, { size: params.size, tick });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <CanvasStage maxWidth={SIZE}>
      <canvas
        ref={canvasRef}
        width={SIZE * dpr}
        height={SIZE * dpr}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </CanvasStage>
  );
}

export function FibonacciSpiralDemo() {
  return (
    <Simulation sim={fibonacciSpiralSim} maxTime={30} delayMs={200}>
      <DemoSplit
        preview={<SpiralCanvas />}
        controls={<DemoControlPanel groups={[]} showStep />}
      />
    </Simulation>
  );
}

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import fibonacciSpiralSim, {
  drawFibonacciSpiral,
} from '../sims/fibonacciSpiralSim';
import styles from './FibonacciSpiralDemo.module.css';

const SIZE = 600;

function SpiralCanvas() {
  const canvasRef = useSimulationCanvas<typeof fibonacciSpiralSim>(
    (ctx, { params, tick }, view) => {
      const scale = view.width / params.size;
      ctx.save();
      ctx.scale(scale, scale);
      drawFibonacciSpiral(ctx, { size: params.size, tick });
      ctx.restore();
    },
    { width: SIZE, height: SIZE }
  );

  return (
    <CanvasStage maxWidth={SIZE}>
      <canvas ref={canvasRef} className={styles.canvas} />
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

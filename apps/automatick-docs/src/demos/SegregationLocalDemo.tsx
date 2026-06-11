import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import segregationSim, { defaultParams, draw } from '../sims/segregationSim';
import styles from './SegregationLocalDemo.module.css';

const CSS_SIZE = defaultParams.width;

function SegregationLocalCanvas() {
  const canvasRef = useSimulationCanvas<typeof segregationSim>(
    (ctx, { data, params }, view) => {
      // draw() works in sim coordinates (params.width × params.height);
      // scale it to fill the logical canvas area.
      ctx.scale(view.width / params.width, view.height / params.height);
      draw({ ctx, snapshot: { data, params } });
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const SEG_LOCAL_GROUPS: DemoControlGroup[] = [
  {
    label: 'Population',
    controls: [
      {
        type: 'range',
        param: 'tolerance',
        label: 'Tolerance',
        min: 0,
        max: 100,
        step: 1,
      },
      {
        type: 'range',
        param: 'proportion',
        label: 'Proportion',
        min: 0,
        max: 100,
        step: 1,
      },
      {
        type: 'range',
        param: 'threshold',
        label: 'Threshold',
        min: 0,
        max: 100,
        step: 1,
      },
    ],
  },
  {
    label: 'Render',
    controls: [
      {
        type: 'toggle',
        param: 'showmoves',
        label: 'Show moves',
      },
    ],
  },
];

export function SegregationLocalDemo() {
  return (
    <Simulation sim={segregationSim} maxTime={50} delayMs={100}>
      <DemoSplit
        preview={<SegregationLocalCanvas />}
        controls={<DemoControlPanel groups={SEG_LOCAL_GROUPS} showStep />}
      />
    </Simulation>
  );
}

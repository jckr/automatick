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

const CSS_SIZE = defaultParams.width;

function SegregationLocalCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const canvasRef = useSimulationCanvas<typeof segregationSim>((ctx, { data, params }) => {
    const scale = (CSS_SIZE * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    draw({ ctx, snapshot: { data, params } });
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

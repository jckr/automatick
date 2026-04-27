import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import segregationSim, { draw } from '../sims/segregationSim';

const CSS_SIZE = 600;

function SegregationCanvas() {
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

function SegregationStats() {
  const { data } = useSimulation<typeof segregationSim>();
  if (!data) return null;
  return (
    <div className='group'>
      <div className='g-lbl'>Readouts</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--fg3)' }}>happiness</span>
          <span style={{ color: 'var(--fg1)' }}>
            {(data.happiness * 100).toFixed(1)}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--fg3)' }}>total moves</span>
          <span style={{ color: 'var(--fg1)' }}>{data.totalMoves}</span>
        </div>
      </div>
    </div>
  );
}

const SEG_GROUPS: DemoControlGroup[] = [
  {
    label: 'Population',
    controls: [
      {
        type: 'range',
        param: 'tolerance',
        label: 'Tolerance %',
        min: 0,
        max: 100,
        step: 1,
      },
      {
        type: 'range',
        param: 'proportion',
        label: 'Proportion %',
        min: 10,
        max: 90,
        step: 1,
      },
      {
        type: 'range',
        param: 'threshold',
        label: 'Threshold %',
        min: 50,
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

export function SegregationDemo() {
  return (
    <Simulation sim={segregationSim} maxTime={500} delayMs={50}>
      <DemoSplit
        preview={<SegregationCanvas />}
        controls={
          <DemoControlPanel
            groups={SEG_GROUPS}
            extra={<SegregationStats />}
            showStep
          />
        }
      />
    </Simulation>
  );
}

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { PerformanceOverlay } from 'automatick/react/performance';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { TimeSeries, TimeSeriesEntry } from '../components/TimeSeries';
import segregationSim, { draw } from '../sims/segregationSim';
import type { SegData } from '../sims/segregationSim';

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
    <div
      style={{
        position: 'relative',
        height: '100%',
        minHeight: 540,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CSS_SIZE * dpr}
          height={CSS_SIZE * dpr}
          style={{
            width: '100%',
            maxWidth: CSS_SIZE,
            height: 'auto',
            display: 'block',
            borderRadius: 4,
          }}
        />
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <PerformanceOverlay />
        </div>
      </div>
      <TimeSeries<SegData>
        mode='line'
        height={100}
        series={SEG_SERIES}
      />
    </div>
  );
}

const SEG_SERIES: TimeSeriesEntry<SegData>[] = [
  {
    color: '#D7451E',
    label: 'Happiness',
    accessor: (d) => d.happiness * 100,
  },
];

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
        controls={<DemoControlPanel groups={SEG_GROUPS} showStep />}
      />
    </Simulation>
  );
}

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
import { segregationDemoPalette } from '../theme/palette';
import styles from './SegregationDemo.module.css';

const CSS_SIZE = 600;

function SegregationCanvas() {
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
    <div className={styles.stage}>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.perf}>
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
    color: segregationDemoPalette.happinessSeries,
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

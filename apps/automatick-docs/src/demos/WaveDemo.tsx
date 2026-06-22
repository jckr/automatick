import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import waveSim from '../sims/waveSim';
import styles from './WaveDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function WaveCanvas() {
  const canvasRef = useSimulationCanvas<typeof waveSim>(
    (ctx, { data }, view) => {
      const w = data.width;
      const h = data.height;
      const cur = data.current;

      // Diverging palette around zero: negative -> blue, zero -> dark, positive -> red/white.
      view.blitGrid(w, h, (px) => {
        for (let i = 0; i < w * h; i++) {
          const v = cur[i];
          const t = Math.max(-1, Math.min(1, v));
          let r: number;
          let g: number;
          let b: number;
          if (t >= 0) {
            // dark -> red -> white
            r = Math.floor(20 + t * 235);
            g = Math.floor(20 + t * t * 235);
            b = Math.floor(30 + t * t * 200);
          } else {
            const s = -t;
            // dark -> blue -> white
            b = Math.floor(40 + s * 215);
            g = Math.floor(20 + s * s * 200);
            r = Math.floor(20 + s * s * 180);
          }
          const j = i * 4;
          px[j] = r;
          px[j + 1] = g;
          px[j + 2] = b;
          px[j + 3] = 255;
        }
      });
    },
    { width: WIDTH, height: HEIGHT }
  );

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const WAVE_GROUPS: DemoControlGroup[] = [
  {
    label: 'Wave',
    controls: [
      {
        type: 'range',
        param: 'damping',
        label: 'Damping',
        min: 0.9,
        max: 1.0,
        step: 0.005,
      },
      {
        type: 'range',
        param: 'speed',
        label: 'Speed',
        min: 0.05,
        max: 0.5,
        step: 0.05,
      },
    ],
  },
  {
    label: 'Source',
    controls: [
      {
        type: 'range',
        param: 'sourceFrequency',
        label: 'Frequency',
        min: 0.01,
        max: 0.2,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'sourceCount',
        label: 'Sources',
        min: 1,
        max: 4,
        step: 1,
      },
    ],
  },
];

export function WaveDemo() {
  return (
    <Simulation sim={waveSim} pauseWhenHidden delayMs={0} autoplay>
      <DemoSplit
        preview={<WaveCanvas />}
        controls={<DemoControlPanel groups={WAVE_GROUPS} />}
      />
    </Simulation>
  );
}

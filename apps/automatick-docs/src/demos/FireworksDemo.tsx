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
import fireworksSim from '../sims/fireworksSim';
import styles from './FireworksDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

const BG = '#05060f';

function FireworksCanvas() {
  const { params, resetWith } = useSimulation<typeof fireworksSim>();
  const initializedRef = React.useRef(false);
  const dprRef = React.useRef<number | null>(null);

  // Rebuild emitters when their count changes.
  const prevCountRef = React.useRef(params.emitterCount);
  React.useEffect(() => {
    if (prevCountRef.current !== params.emitterCount) {
      prevCountRef.current = params.emitterCount;
      initializedRef.current = false;
      resetWith();
    }
  }, [params.emitterCount, resetWith]);

  const canvasRef = useSimulationCanvas<typeof fireworksSim>(
    (ctx, { data }, view) => {
      // This renderer accumulates: each frame fades the previous frame and
      // draws on top with additive blending. A dpr change resizes (and wipes)
      // the backing store, so re-prime the background when it changes.
      if (!initializedRef.current || view.dpr !== dprRef.current) {
        view.clear(BG);
        initializedRef.current = true;
        dprRef.current = view.dpr;
      }
      // Trail fade.
      view.fade(0.18, BG);

      ctx.globalCompositeOperation = 'lighter';
      data.particles.forEach((p) => {
        const light =
          p.type === 'burst' ? 65 : p.type === 'spark' ? 70 : 50;
        const alpha = Math.max(0, Math.min(1, p.life));
        const r =
          p.type === 'burst'
            ? p.size
            : p.type === 'trail'
              ? p.size
              : p.size;
        ctx.fillStyle = `hsla(${p.hue}, 100%, ${light}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    },
    { width: WIDTH, height: HEIGHT }
  );

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const CONTROL_GROUPS: DemoControlGroup[] = [
  {
    label: 'Launch',
    controls: [
      {
        type: 'range',
        param: 'emitterCount',
        label: 'Emitters',
        min: 1,
        max: 5,
        step: 1,
      },
      {
        type: 'range',
        param: 'launchInterval',
        label: 'Launch interval',
        min: 10,
        max: 100,
        step: 5,
      },
      {
        type: 'range',
        param: 'burstSize',
        label: 'Burst size',
        min: 20,
        max: 200,
        step: 10,
      },
    ],
  },
  {
    label: 'Physics',
    controls: [
      {
        type: 'range',
        param: 'gravity',
        label: 'Gravity',
        min: 0.01,
        max: 0.3,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'drag',
        label: 'Drag',
        min: 0,
        max: 0.05,
        step: 0.005,
      },
      {
        type: 'range',
        param: 'windStrength',
        label: 'Wind',
        min: -0.1,
        max: 0.1,
        step: 0.01,
      },
    ],
  },
];

export function FireworksDemo() {
  return (
    <Simulation sim={fireworksSim} pauseWhenHidden delayMs={16} autoplay>
      <DemoSplit
        preview={<FireworksCanvas />}
        controls={<DemoControlPanel groups={CONTROL_GROUPS} />}
      />
    </Simulation>
  );
}

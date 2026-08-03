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
import particleLifeSim, {
  type ParticleLifeParams,
} from '../sims/particleLifeSim';
import { particleLifePalette } from '../theme/palette';
import styles from './ParticleLifeDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function ParticleLifeCanvas() {
  const { params, resetWith } = useSimulation<typeof particleLifeSim>();
  const prevRandomizeRef = React.useRef(params.randomizeForces);

  // Flipping the "randomize matrix" toggle reseeds via a fresh init.
  React.useEffect(() => {
    if (params.randomizeForces !== prevRandomizeRef.current) {
      prevRandomizeRef.current = params.randomizeForces;
      resetWith();
    }
  }, [params.randomizeForces, resetWith]);

  const initializedRef = React.useRef(false);

  const canvasRef = useSimulationCanvas<typeof particleLifeSim>(
    (ctx, { data }, view) => {
      if (!initializedRef.current) {
        view.clear(particleLifePalette.bg);
        initializedRef.current = true;
      }
      // Semi-transparent fill for subtle trails.
      view.fade(0.18, particleLifePalette.bg);

      const scale = WIDTH / data.worldSize;
      const numTypes = data.numTypes;
      data.particles.forEach((p) => {
        const hue = (p.type / numTypes) * 360;
        ctx.fillStyle = `hsl(${hue}, ${particleLifePalette.saturation}%, ${particleLifePalette.lightness}%)`;
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    { width: WIDTH, height: HEIGHT },
  );

  // Reseed when structural params change so a fresh world is built.
  const prevStructRef = React.useRef({
    numParticles: params.numParticles,
    numTypes: params.numTypes,
  });
  React.useEffect(() => {
    const prev = prevStructRef.current;
    if (
      prev.numParticles !== params.numParticles ||
      prev.numTypes !== params.numTypes
    ) {
      prevStructRef.current = {
        numParticles: params.numParticles,
        numTypes: params.numTypes,
      };
      initializedRef.current = false;
      resetWith();
    }
  }, [params.numParticles, params.numTypes, resetWith]);

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const CONTROL_GROUPS: DemoControlGroup[] = [
  {
    label: 'Particles',
    controls: [
      {
        type: 'range',
        param: 'numParticles',
        label: 'Particles',
        min: 100,
        max: 2000,
        step: 100,
      },
      {
        type: 'range',
        param: 'numTypes',
        label: 'Types',
        min: 2,
        max: 8,
        step: 1,
      },
    ],
  },
  {
    label: 'Forces',
    controls: [
      {
        type: 'range',
        param: 'friction',
        label: 'Friction',
        min: 0.5,
        max: 0.99,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'forceRange',
        label: 'Force range',
        min: 20,
        max: 150,
        step: 10,
      },
      {
        type: 'range',
        param: 'forceStrength',
        label: 'Force strength',
        min: 0.1,
        max: 5,
        step: 0.1,
      },
      { type: 'toggle', param: 'randomizeForces', label: 'Randomize matrix' },
    ],
  },
];

export function ParticleLifeDemo() {
  return (
    <Simulation
      sim={particleLifeSim}
      params={{ worldSize: WIDTH } as Partial<ParticleLifeParams>}
      delayMs={16}
      autoplay
    >
      <DemoSplit
        preview={<ParticleLifeCanvas />}
        controls={<DemoControlPanel groups={CONTROL_GROUPS} />}
      />
    </Simulation>
  );
}

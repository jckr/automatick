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
import springMassSim from '../sims/springMassSim';
import { springMassPalette } from '../theme/palette';
import styles from './SpringMassDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;

function strainColor(strain: number): string {
  // strain > 0 = stretched (warm/red), < 0 = compressed (cool/blue).
  const t = Math.max(-1, Math.min(1, strain * 6));
  if (t >= 0) {
    const g = Math.round(springMassPalette.stretchG0 - t * springMassPalette.stretchGDelta);
    return `rgb(${springMassPalette.stretchR}, ${g}, ${Math.round(springMassPalette.stretchB0 - t * springMassPalette.stretchBDelta)})`;
  }
  const a = -t;
  const r = Math.round(springMassPalette.compressR0 - a * springMassPalette.compressRDelta);
  return `rgb(${r}, ${Math.round(springMassPalette.compressG0 - a * springMassPalette.compressGDelta)}, ${springMassPalette.compressB})`;
}

function SpringMassCanvas() {
  const { params, resetWith } = useSimulation<typeof springMassSim>();

  // Rebuild the structure when preset or grid size changes.
  const prevRef = React.useRef({
    preset: params.preset,
    gridSize: params.gridSize,
  });
  React.useEffect(() => {
    const prev = prevRef.current;
    if (prev.preset !== params.preset || prev.gridSize !== params.gridSize) {
      prevRef.current = { preset: params.preset, gridSize: params.gridSize };
      resetWith();
    }
  }, [params.preset, params.gridSize, resetWith]);

  const canvasRef = useSimulationCanvas<typeof springMassSim>(
    (ctx, { data }, view) => {
      view.clear();

      const { nodes, springs } = data;

      // Springs, colored by strain.
      ctx.lineWidth = 1.5;
      for (let i = 0; i < springs.length; i++) {
        const sp = springs[i];
        const na = nodes[sp.a];
        const nb = nodes[sp.b];
        const len = Math.hypot(nb.x - na.x, nb.y - na.y);
        const strain = (len - sp.restLength) / sp.restLength;
        ctx.strokeStyle = strainColor(strain);
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }

      // Nodes.
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.fixed) {
          ctx.fillStyle = springMassPalette.fixedNode;
          ctx.fillRect(n.x - 4, n.y - 4, 8, 8);
        } else {
          ctx.fillStyle = springMassPalette.freeNode;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
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
    label: 'Setup',
    controls: [
      {
        type: 'chips',
        param: 'preset',
        label: 'Preset',
        options: [
          { value: 'chain', label: 'Chain' },
          { value: 'grid', label: 'Jelly' },
          { value: 'bridge', label: 'Bridge' },
        ],
      },
      {
        type: 'range',
        param: 'gridSize',
        label: 'Grid size',
        min: 4,
        max: 12,
        step: 1,
      },
    ],
  },
  {
    label: 'Physics',
    controls: [
      {
        type: 'range',
        param: 'stiffness',
        label: 'Stiffness',
        min: 0.1,
        max: 5,
        step: 0.1,
      },
      {
        type: 'range',
        param: 'damping',
        label: 'Damping',
        min: 0,
        max: 0.2,
        step: 0.01,
      },
      {
        type: 'range',
        param: 'gravity',
        label: 'Gravity',
        min: 0,
        max: 2,
        step: 0.1,
      },
    ],
  },
];

export function SpringMassDemo() {
  return (
    <Simulation sim={springMassSim} delayMs={16} autoplay>
      <DemoSplit
        preview={<SpringMassCanvas />}
        controls={<DemoControlPanel groups={CONTROL_GROUPS} showStep />}
      />
    </Simulation>
  );
}

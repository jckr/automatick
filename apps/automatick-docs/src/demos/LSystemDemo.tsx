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
import lSystemSim, { PRESETS, type LSystemParams } from '../sims/lSystemSim';
import { lSystemPalette } from '../theme/palette';
import styles from './LSystemDemo.module.css';

const WIDTH = 600;
const HEIGHT = 600;
const PADDING = 24;

type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
};

// Interpret an L-system string with turtle graphics. The turtle starts facing
// "up" (-90 degrees). Returns the line segments plus their bounding box so the
// drawing can be auto-fit to the canvas.
function interpret(
  str: string,
  angleDeg: number,
): {
  segments: Segment[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const angle = (angleDeg * Math.PI) / 180;
  const step = 1;

  let x = 0;
  let y = 0;
  let dir = -Math.PI / 2;
  let depth = 0;

  const stack: Array<{ x: number; y: number; dir: number; depth: number }> = [];
  const segments: Segment[] = [];

  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  const track = (px: number, py: number) => {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  };

  // Cap segments so a huge string can't lock up the renderer.
  const MAX_SEGMENTS = 200000;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === 'F' || c === 'A' || c === 'B') {
      const nx = x + Math.cos(dir) * step;
      const ny = y + Math.sin(dir) * step;
      if (segments.length < MAX_SEGMENTS) {
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, depth });
      }
      x = nx;
      y = ny;
      track(x, y);
    } else if (c === '+') {
      dir += angle;
    } else if (c === '-') {
      dir -= angle;
    } else if (c === '[') {
      stack.push({ x, y, dir, depth });
      depth++;
    } else if (c === ']') {
      const s = stack.pop();
      if (s) {
        x = s.x;
        y = s.y;
        dir = s.dir;
        depth = s.depth;
      }
    }
  }

  return { segments, minX, minY, maxX, maxY };
}

function LSystemCanvas() {
  const canvasRef = useSimulationCanvas<typeof lSystemSim>(
    (ctx, { data, params }, view) => {
      view.clear();

      const { segments, minX, minY, maxX, maxY } = interpret(
        data.current,
        params.angle,
      );
      if (segments.length === 0) {
        return;
      }

      // Auto-fit: scale and translate so the bounding box fills the canvas.
      const bw = maxX - minX || 1;
      const bh = maxY - minY || 1;
      const scale = Math.min(
        (WIDTH - PADDING * 2) / bw,
        (HEIGHT - PADDING * 2) / bh,
      );
      const offsetX = (WIDTH - bw * scale) / 2 - minX * scale;
      const offsetY = (HEIGHT - bh * scale) / 2 - minY * scale;

      let maxDepth = 0;
      for (const s of segments) if (s.depth > maxDepth) maxDepth = s.depth;

      const isPlant = params.preset === 'plant' || params.preset === 'tree';

      for (const s of segments) {
        const t = maxDepth > 0 ? s.depth / maxDepth : 0;
        if (isPlant) {
          // Trunk = brown, tips = green.
          const r = Math.round(
            lSystemPalette.plantR0 - t * lSystemPalette.plantRDelta,
          );
          const g = Math.round(
            lSystemPalette.plantG0 + t * lSystemPalette.plantGDelta,
          );
          const b = Math.round(
            lSystemPalette.plantB0 + t * lSystemPalette.plantBDelta,
          );
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = Math.max(0.5, (1 - t) * 2.5);
        } else {
          // Fractal gradient by depth (blue → orange).
          const r = Math.round(
            lSystemPalette.fractalR0 + t * lSystemPalette.fractalRDelta,
          );
          const g = Math.round(
            lSystemPalette.fractalG0 + t * lSystemPalette.fractalGDelta,
          );
          const b = Math.round(
            lSystemPalette.fractalB0 - t * lSystemPalette.fractalBDelta,
          );
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = 1;
        }
        ctx.beginPath();
        ctx.moveTo(s.x1 * scale + offsetX, s.y1 * scale + offsetY);
        ctx.lineTo(s.x2 * scale + offsetX, s.y2 * scale + offsetY);
        ctx.stroke();
      }
    },
    { width: WIDTH, height: HEIGHT },
  );

  return (
    <CanvasStage maxWidth={WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

function GenerationStats() {
  const { data } = useSimulation<typeof lSystemSim>();
  const gen = data?.generation ?? 0;
  const len = data?.current.length ?? 0;
  return (
    <div className='group'>
      <div className='g-lbl'>State</div>
      <div className='ctrl' style={{ gridTemplateColumns: '1fr auto' }}>
        <label>Generation</label>
        <span className='val'>{gen}</span>
      </div>
      <div className='ctrl' style={{ gridTemplateColumns: '1fr auto' }}>
        <label>String length</label>
        <span className='val'>{len.toLocaleString()}</span>
      </div>
    </div>
  );
}

// Switching preset resets the sim and snaps the angle to that preset's default.
function ResetOnPresetChange({ children }: { children: React.ReactNode }) {
  const { params, setParams, resetWith } = useSimulation<typeof lSystemSim>();
  const lastRef = React.useRef<string>('');
  React.useEffect(() => {
    if (lastRef.current && lastRef.current !== params.preset) {
      setParams({
        angle: PRESETS[params.preset].angle,
      } as Partial<LSystemParams>);
      resetWith();
    }
    lastRef.current = params.preset;
  }, [params.preset, setParams, resetWith]);
  return <>{children}</>;
}

const LSYSTEM_GROUPS: DemoControlGroup[] = [
  {
    label: 'L-System',
    controls: [
      {
        type: 'chips',
        param: 'preset',
        label: 'Preset',
        options: [
          { value: 'plant', label: 'Plant' },
          { value: 'tree', label: 'Tree' },
          { value: 'koch', label: 'Koch' },
          { value: 'sierpinski', label: 'Sierpinski' },
          { value: 'dragon', label: 'Dragon' },
        ],
      },
      {
        type: 'range',
        param: 'angle',
        label: 'Angle',
        min: 10,
        max: 120,
        step: 1,
        format: (v: number) => `${v}°`,
      },
      {
        type: 'range',
        param: 'maxGenerations',
        label: 'Generations',
        min: 2,
        max: 7,
        step: 1,
      },
    ],
  },
];

export function LSystemDemo() {
  return (
    <Simulation sim={lSystemSim} delayMs={600} autoplay>
      <ResetOnPresetChange>
        <DemoSplit
          preview={<LSystemCanvas />}
          controls={
            <DemoControlPanel
              groups={LSYSTEM_GROUPS}
              extra={<GenerationStats />}
              showStep
            />
          }
        />
      </ResetOnPresetChange>
    </Simulation>
  );
}

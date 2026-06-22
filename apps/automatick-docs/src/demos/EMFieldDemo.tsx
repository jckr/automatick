import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import emFieldSim from '../sims/emFieldSim';
import type { EMCharge } from '../sims/emFieldSim';
import styles from './EMFieldDemo.module.css';

const CSS_SIZE = 600;

// Diverging potential heatmap: dark mid, red for positive, blue for negative.
const MID: [number, number, number] = [16, 18, 26];
const POS: [number, number, number] = [228, 78, 58];
const NEG: [number, number, number] = [62, 124, 232];
const BG_HEX = '#10121a';
const POT_VIS = 2.6; // tanh scale for potential → color

const POS_FILL = '#e74c3c';
const NEG_FILL = '#3b82f6';

// Field-line tracing.
const NLINES = 8;
const STEP = 4;
const MAX_STEPS = 130;
const CAP_R2 = 11 * 11; // line terminates this close to a negative charge
const LINE_SOFT2 = 4 * 4;

function chargeRadius(charge: number): number {
  return 5 + Math.abs(charge) * 3.5;
}

/** Electric field direction E = Σ q·r̂ / r² at a point (softened). */
function fieldAt(charges: EMCharge[], x: number, y: number): [number, number] {
  let ex = 0;
  let ey = 0;
  for (const c of charges) {
    const dx = x - c.x;
    const dy = y - c.y;
    const r2 = dx * dx + dy * dy + LINE_SOFT2;
    const inv = c.charge / (r2 * Math.sqrt(r2));
    ex += inv * dx;
    ey += inv * dy;
  }
  return [ex, ey];
}

function EMFieldCanvas() {
  // The heatmap scales a coarse grid up WITH smoothing (a smooth gradient
  // look), so it keeps a manual offscreen canvas — view.blitGrid always
  // disables smoothing for crisp cells, which is the opposite intent.
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof emFieldSim>(
    (ctx, { data, params }, view) => {
      const { charges, potential, res, width } = data;
      const scale = CSS_SIZE / width;

      // --- Layer 1: potential heatmap (or flat backdrop) ---
      if (params.showPotential) {
        if (!offscreenRef.current || offscreenRef.current.width !== res) {
          const off = document.createElement('canvas');
          off.width = res;
          off.height = res;
          offscreenRef.current = off;
          imageDataRef.current = null;
        }
        const off = offscreenRef.current;
        const offCtx = off.getContext('2d');
        if (offCtx) {
          if (!imageDataRef.current) {
            imageDataRef.current = offCtx.createImageData(res, res);
          }
          const px = imageDataRef.current.data;
          for (let i = 0; i < res * res; i++) {
            const t = Math.tanh(potential[i] * POT_VIS); // [-1, 1]
            const end = t >= 0 ? POS : NEG;
            const a = Math.abs(t);
            const j = i * 4;
            px[j] = MID[0] + (end[0] - MID[0]) * a;
            px[j + 1] = MID[1] + (end[1] - MID[1]) * a;
            px[j + 2] = MID[2] + (end[2] - MID[2]) * a;
            px[j + 3] = 255;
          }
          offCtx.putImageData(imageDataRef.current, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(off, 0, 0, CSS_SIZE, CSS_SIZE);
        }
      } else {
        view.clear(BG_HEX);
      }

      // --- Layer 2: field lines from each positive charge ---
      if (params.showFieldLines) {
        ctx.strokeStyle = 'rgba(222, 228, 240, 0.34)';
        ctx.lineWidth = 1;
        for (const c of charges) {
          if (c.charge <= 0) continue;
          const startR = chargeRadius(c.charge) + 2;
          for (let li = 0; li < NLINES; li++) {
            const ang = (li / NLINES) * Math.PI * 2;
            let x = c.x + Math.cos(ang) * startR;
            let y = c.y + Math.sin(ang) * startR;
            ctx.beginPath();
            ctx.moveTo(x * scale, y * scale);
            for (let s = 0; s < MAX_STEPS; s++) {
              const [ex, ey] = fieldAt(charges, x, y);
              const m = Math.hypot(ex, ey);
              if (m < 1e-9) break;
              x += (ex / m) * STEP;
              y += (ey / m) * STEP;
              ctx.lineTo(x * scale, y * scale);
              if (x < 0 || x > width || y < 0 || y > data.height) break;
              let hitNeg = false;
              for (const c2 of charges) {
                if (c2.charge >= 0) continue;
                const dx = x - c2.x;
                const dy = y - c2.y;
                if (dx * dx + dy * dy < CAP_R2) {
                  hitNeg = true;
                  break;
                }
              }
              if (hitNeg) break;
            }
            ctx.stroke();
          }
        }
      }

      // --- Layer 3: charges ---
      for (const c of charges) {
        const r = chargeRadius(c.charge) * scale;
        const cx = c.x * scale;
        const cy = c.y * scale;
        ctx.fillStyle = c.charge > 0 ? POS_FILL : NEG_FILL;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.stroke();

        // +/− glyph.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.45, cy);
        ctx.lineTo(cx + r * 0.45, cy);
        if (c.charge > 0) {
          ctx.moveTo(cx, cy - r * 0.45);
          ctx.lineTo(cx, cy + r * 0.45);
        }
        ctx.stroke();
      }
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

const EM_GROUPS: DemoControlGroup[] = [
  {
    label: 'Charges',
    controls: [
      {
        type: 'range',
        param: 'numPositive',
        label: 'Positive',
        min: 1,
        max: 10,
        step: 1,
      },
      {
        type: 'range',
        param: 'numNegative',
        label: 'Negative',
        min: 1,
        max: 10,
        step: 1,
      },
      { type: 'toggle', param: 'fixedCharges', label: 'Fixed charges' },
    ],
  },
  {
    label: 'Visualization',
    controls: [
      { type: 'toggle', param: 'showPotential', label: 'Potential map' },
      { type: 'toggle', param: 'showFieldLines', label: 'Field lines' },
      {
        type: 'range',
        param: 'coulombStrength',
        label: 'Force strength',
        min: 200,
        max: 5000,
        step: 100,
      },
      {
        type: 'range',
        param: 'damping',
        label: 'Damping',
        min: 0.9,
        max: 1,
        step: 0.005,
        format: (v) => v.toFixed(3),
      },
    ],
  },
];

export function EMFieldDemo() {
  return (
    <Simulation sim={emFieldSim} pauseWhenHidden delayMs={0} autoplay>
      <DemoSplit
        preview={<EMFieldCanvas />}
        controls={<DemoControlPanel groups={EM_GROUPS} showStep />}
      />
    </Simulation>
  );
}

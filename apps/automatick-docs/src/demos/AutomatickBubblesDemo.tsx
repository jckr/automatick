import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { PerformanceOverlay } from 'automatick/react/performance';
import { DemoControlPanel, type DemoControlGroup } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import automatickBubblesSim, {
  type BubblesParams,
} from '../sims/automatickBubblesSim';
import { getLetterMask, isInsideMask, maskFontString } from '../sims/automatickHeroMask';

/**
 * Stage 2: bubbles render as a metaball iso-contour.
 *
 * Each bubble contributes a Wyvill kernel (1 - (d/R)²)³ to a scalar field.
 * The field is built at half-resolution into an offscreen canvas; pixels
 * with field > threshold are painted, with a smooth alpha edge band for
 * anti-aliasing. The offscreen canvas is then drawn to the main canvas at
 * full size — the browser's bilinear smoothing turns the blocky
 * coarse-grid edge into a soft organic contour for free.
 *
 * When two bubble centers get close, their fields sum, the threshold is
 * met in the space between them, and a bridge / membrane appears.
 *
 * Color: each cell averages the colors of contributing bubbles, weighted
 * by their kernel contribution. A bubble is colored "accent" if its center
 * is inside the letter mask, "neutral" otherwise. So a bridge between two
 * mostly-inside bubbles is fully accent; a bridge spanning the mask edge
 * is a smooth gradient.
 */

const STAGE_HEIGHT = 480;
const CELL_SIZE = 2;
const ISO_THRESHOLD = 0.5;
const EDGE_BAND = 0.35;

/** Outside-mask bubble palette spans hue space from cyan-blue (200°) through
 *  green and yellow to orange (30°) — counterclockwise around the wheel,
 *  skipping red so it never competes with the accent vermilion. Saturation
 *  and lightness are fixed so the palette reads as a continuous chromatic
 *  band rather than a few discrete tints. */
const HUE_DEG_MIN = 30; // orange
const HUE_DEG_MAX = 200; // cyan-blue
const PALETTE_S = 0.5;
const PALETTE_L = 0.42;

function hslToRgb(h: number, s: number, l: number): ColorRGB {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2c = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = hue2c(h + 1 / 3) * 255;
  const g = hue2c(h) * 255;
  const b = hue2c(h - 1 / 3) * 255;
  return [r, g, b];
}

type ColorRGB = readonly [number, number, number];

function parseHex(hex: string, fallback: ColorRGB): ColorRGB {
  const h = hex.trim();
  if (!h.startsWith('#') || (h.length !== 4 && h.length !== 7)) return fallback;
  const expand = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  const r = parseInt(expand.slice(1, 3), 16);
  const g = parseInt(expand.slice(3, 5), 16);
  const b = parseInt(expand.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return fallback;
  return [r, g, b];
}

export type AutomatickBubblesCanvasProps = {
  minHeight?: number | string;
  showPerf?: boolean;
};

export function AutomatickBubblesCanvas({
  minHeight = STAGE_HEIGHT,
  showPerf = true,
}: AutomatickBubblesCanvasProps) {
  const { setParams, resetWith } = useSimulation<typeof automatickBubblesSim>();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);

  // Two offscreen canvases + field buffers — one for outside-mask bubbles
  // (composited with the user-selected fun blend mode against the trail
  // canvas) and one for inside-mask bubbles (always composited last with
  // source-over so the wordmark stays crisp on top of any overlap effects).
  const offOutRef = React.useRef<HTMLCanvasElement | null>(null);
  const offInRef = React.useRef<HTMLCanvasElement | null>(null);
  const offOutCtxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const offInCtxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const fieldOutRef = React.useRef<Float32Array | null>(null);
  const fieldInRef = React.useRef<Float32Array | null>(null);
  const rOutRef = React.useRef<Float32Array | null>(null);
  const gOutRef = React.useRef<Float32Array | null>(null);
  const bOutRef = React.useRef<Float32Array | null>(null);
  const rInRef = React.useRef<Float32Array | null>(null);
  const gInRef = React.useRef<Float32Array | null>(null);
  const bInRef = React.useRef<Float32Array | null>(null);
  const imgOutRef = React.useRef<ImageData | null>(null);
  const imgInRef = React.useRef<ImageData | null>(null);
  const lastDimsRef = React.useRef<{ cols: number; rows: number }>({ cols: 0, rows: 0 });

  const canvasRef = useSimulationCanvas<typeof automatickBubblesSim>(
    (ctx, { data, params }) => {
      const styles = getComputedStyle(document.documentElement);
      const bg = styles.getPropertyValue('--bg1').trim() || '#F7F3EA';
      const ink = styles.getPropertyValue('--fg1').trim() || '#0E1116';
      const accentColor = parseHex(
        styles.getPropertyValue('--accent').trim() || '#D7451E',
        [215, 69, 30]
      );
      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Trails: fade the previous frame toward bg instead of clearing.
      // Lower `trailFade` = longer-lived trails. Bubbles inside the
      // wordmark continuously repaint that region from the field render
      // below, so the wordmark stays crisp; outside, sparse moving bubbles
      // leave decaying chromatic trails.
      ctx.fillStyle = bg;
      ctx.globalAlpha = params.trailFade;
      ctx.fillRect(0, 0, params.width, params.height);
      ctx.globalAlpha = 1;

      const mask = getLetterMask(params.text, params.width, params.height);

      if (params.showMask) {
        ctx.save();
        ctx.font = maskFontString(mask.fontPx);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.08;
        ctx.fillText(params.text, params.width / 2, params.height / 2);
        ctx.restore();
      }

      // (Re)allocate offscreen buffers when canvas size changes.
      const cols = Math.max(1, Math.ceil(params.width / CELL_SIZE));
      const rows = Math.max(1, Math.ceil(params.height / CELL_SIZE));
      if (lastDimsRef.current.cols !== cols || lastDimsRef.current.rows !== rows) {
        const offOut = offOutRef.current ?? document.createElement('canvas');
        offOut.width = cols;
        offOut.height = rows;
        offOutRef.current = offOut;
        offOutCtxRef.current = offOut.getContext('2d');
        const offIn = offInRef.current ?? document.createElement('canvas');
        offIn.width = cols;
        offIn.height = rows;
        offInRef.current = offIn;
        offInCtxRef.current = offIn.getContext('2d');
        fieldOutRef.current = new Float32Array(cols * rows);
        fieldInRef.current = new Float32Array(cols * rows);
        rOutRef.current = new Float32Array(cols * rows);
        gOutRef.current = new Float32Array(cols * rows);
        bOutRef.current = new Float32Array(cols * rows);
        rInRef.current = new Float32Array(cols * rows);
        gInRef.current = new Float32Array(cols * rows);
        bInRef.current = new Float32Array(cols * rows);
        imgOutRef.current = offOutCtxRef.current!.createImageData(cols, rows);
        imgInRef.current = offInCtxRef.current!.createImageData(cols, rows);
        lastDimsRef.current = { cols, rows };
      }

      const offOutCtx = offOutCtxRef.current!;
      const offInCtx = offInCtxRef.current!;
      const fieldOut = fieldOutRef.current!;
      const fieldIn = fieldInRef.current!;
      const rOut = rOutRef.current!;
      const gOut = gOutRef.current!;
      const bOut = bOutRef.current!;
      const rIn = rInRef.current!;
      const gIn = gInRef.current!;
      const bIn = bInRef.current!;
      const imgOut = imgOutRef.current!;
      const imgIn = imgInRef.current!;
      // Reset accumulators (Float32Array.fill is fast).
      fieldOut.fill(0);
      fieldIn.fill(0);
      rOut.fill(0);
      gOut.fill(0);
      bOut.fill(0);
      rIn.fill(0);
      gIn.fill(0);
      bIn.fill(0);

      // Splat each bubble onto whichever layer (in / out) it belongs to.
      // The kernel-weighted color accumulation means overlapping bubbles
      // within the same frame blend smoothly via the per-pixel weighted
      // average. Across frames, the chosen blend mode handles the trail
      // overlap effects.
      const bubbles = data.bubbles;
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        const inside = isInsideMask(mask, b.x, b.y);
        let field: Float32Array;
        let rCh: Float32Array;
        let gCh: Float32Array;
        let bCh: Float32Array;
        let cR: number;
        let cG: number;
        let cB: number;
        if (inside) {
          field = fieldIn;
          rCh = rIn;
          gCh = gIn;
          bCh = bIn;
          cR = accentColor[0];
          cG = accentColor[1];
          cB = accentColor[2];
        } else {
          field = fieldOut;
          rCh = rOut;
          gCh = gOut;
          bCh = bOut;
          const hueDeg = HUE_DEG_MIN + (HUE_DEG_MAX - HUE_DEG_MIN) * b.hue;
          const [hr, hg, hb] = hslToRgb(hueDeg / 360, PALETTE_S, PALETTE_L);
          cR = hr;
          cG = hg;
          cB = hb;
        }

        const cx = b.x / CELL_SIZE;
        const cy = b.y / CELL_SIZE;
        const R = b.r / CELL_SIZE;
        const Rsq = R * R;
        if (Rsq <= 0) continue;
        const minC = Math.max(0, Math.floor(cx - R));
        const maxC = Math.min(cols - 1, Math.ceil(cx + R));
        const minR = Math.max(0, Math.floor(cy - R));
        const maxR = Math.min(rows - 1, Math.ceil(cy + R));

        for (let r = minR; r <= maxR; r++) {
          const rowOffset = r * cols;
          for (let c = minC; c <= maxC; c++) {
            const dx = c - cx;
            const dy = r - cy;
            const dsq = dx * dx + dy * dy;
            if (dsq >= Rsq) continue;
            const t = 1 - dsq / Rsq;
            const k = t * t * t; // Wyvill bell, max 1 at center
            const idx = rowOffset + c;
            field[idx] += k;
            rCh[idx] += k * cR;
            gCh[idx] += k * cG;
            bCh[idx] += k * cB;
          }
        }
      }

      // Threshold + write RGBA, twice — once for each layer. Soft edge:
      // alpha ramps from 0 at (threshold − EDGE_BAND) to 1 at threshold.
      const total = cols * rows;
      const edgeStart = ISO_THRESHOLD - EDGE_BAND;
      const writeLayer = (
        f: Float32Array,
        rCh: Float32Array,
        gCh: Float32Array,
        bCh: Float32Array,
        out: ImageData
      ) => {
        const data8 = out.data;
        for (let i = 0; i < total; i++) {
          const fv = f[i];
          if (fv <= edgeStart) {
            data8[i * 4 + 3] = 0;
            continue;
          }
          const inv = fv > 0 ? 1 / fv : 0;
          let alpha = (fv - edgeStart) / EDGE_BAND;
          if (alpha > 1) alpha = 1;
          const o = i * 4;
          data8[o] = rCh[i] * inv;
          data8[o + 1] = gCh[i] * inv;
          data8[o + 2] = bCh[i] * inv;
          data8[o + 3] = alpha * 255;
        }
      };
      writeLayer(fieldOut, rOut, gOut, bOut, imgOut);
      writeLayer(fieldIn, rIn, gIn, bIn, imgIn);
      offOutCtx.putImageData(imgOut, 0, 0);
      offInCtx.putImageData(imgIn, 0, 0);

      // Composite the two layers onto the main canvas (which carries the
      // faded previous frame). Outside-mask layer first, with the
      // user-selected blend mode — that's where trail-on-trail overlaps
      // produce the chromatic interactions. Inside-mask layer last with
      // source-over so the wordmark always reads cleanly on top of any
      // weirdness happening below.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalCompositeOperation = params.outsideBlendMode as GlobalCompositeOperation;
      ctx.drawImage(offOutRef.current!, 0, 0, params.width, params.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(offInRef.current!, 0, 0, params.width, params.height);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  );

  React.useEffect(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const apply = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      if (!initializedRef.current) {
        initializedRef.current = true;
        resetWith({ width: w, height: h } as Partial<BubblesParams>);
      } else {
        setParams({ width: w, height: h } as Partial<BubblesParams>);
      }
    };
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [canvasRef, setParams, resetWith]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight,
        lineHeight: 0,
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {showPerf ? (
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <PerformanceOverlay />
        </div>
      ) : null}
    </div>
  );
}

const BUBBLES_GROUPS: DemoControlGroup[] = [
  {
    label: 'Bubbles',
    controls: [
      { type: 'range', param: 'nbBubbles', label: 'Count', min: 50, max: 5000, step: 50 },
      { type: 'range', param: 'blobSize', label: 'Size', min: 3, max: 40, step: 1 },
      {
        type: 'range',
        param: 'blobSizeVariance',
        label: 'Size variance',
        min: 0,
        max: 1,
        step: 0.02,
        format: (v) => v.toFixed(2),
      },
    ],
  },
  {
    label: 'Flow',
    controls: [
      {
        type: 'range',
        param: 'baseSpeed',
        label: 'Speed',
        min: 0.1,
        max: 5,
        step: 0.05,
        format: (v) => v.toFixed(2),
      },
      {
        type: 'range',
        param: 'minSpeedFactor',
        label: 'Slowdown (in mask)',
        min: 0.02,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        type: 'range',
        param: 'vyJitter',
        label: 'Vertical wobble',
        min: 0,
        max: 0.5,
        step: 0.005,
        format: (v) => v.toFixed(3),
      },
    ],
  },
  {
    label: 'Trails',
    controls: [
      {
        type: 'range',
        param: 'trailFade',
        label: 'Fade per frame',
        min: 0.01,
        max: 0.5,
        step: 0.005,
        format: (v) => v.toFixed(3),
      },
      {
        type: 'chips',
        param: 'outsideBlendMode',
        label: 'Outside blend',
        options: [
          { value: 'source-over', label: 'normal' },
          { value: 'screen', label: 'screen' },
          { value: 'multiply', label: 'multiply' },
          { value: 'overlay', label: 'overlay' },
          { value: 'soft-light', label: 'soft-light' },
          { value: 'hard-light', label: 'hard-light' },
          { value: 'difference', label: 'difference' },
          { value: 'exclusion', label: 'exclusion' },
          { value: 'color-dodge', label: 'dodge' },
          { value: 'color-burn', label: 'burn' },
          { value: 'hue', label: 'hue' },
          { value: 'color', label: 'color' },
          { value: 'lighter', label: 'add' },
        ],
      },
    ],
  },
  {
    label: 'Render',
    controls: [{ type: 'toggle', param: 'showMask', label: 'Show letter shape' }],
  },
];

export function AutomatickBubblesDemo() {
  return (
    <Simulation sim={automatickBubblesSim} delayMs={16}>
      <DemoSplit
        preview={<AutomatickBubblesCanvas />}
        controls={<DemoControlPanel groups={BUBBLES_GROUPS} />}
      />
    </Simulation>
  );
}

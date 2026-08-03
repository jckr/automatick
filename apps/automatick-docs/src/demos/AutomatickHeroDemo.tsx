import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { PerformanceOverlay } from 'automatick/react/performance';
import { DemoControlPanel, type DemoControlGroup } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import automatickHeroSim from '../sims/automatickHeroSim';
import { getLetterMask, maskFontString } from '../sims/automatickHeroMask';
import { heroPalette } from '../theme/palette';
import styles from './AutomatickHeroDemo.module.css';

const STAGE_HEIGHT = 480;

export type AutomatickHeroCanvasProps = {
  /** Minimum stage height in CSS pixels. Defaults to STAGE_HEIGHT. */
  minHeight?: number;
  /** Show the floating performance overlay. Defaults to true. */
  showPerf?: boolean;
};

export function AutomatickHeroCanvas({
  minHeight = STAGE_HEIGHT,
  showPerf = true,
}: AutomatickHeroCanvasProps) {
  const { setParams, resetWith } = useSimulation<typeof automatickHeroSim>();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);
  // Logical canvas size follows the wrapper; the hook owns the backing store.
  const [dims, setDims] = React.useState<{ width: number; height: number } | null>(null);

  const canvasRef = useSimulationCanvas<typeof automatickHeroSim>(
    (ctx, { data, params }, view) => {
      const bg = view.theme('--bg1', heroPalette.bgFallback);
      const linkColor = view.theme('--accent', heroPalette.linkFallback);
      const nodeColor = view.theme('--fg1', heroPalette.nodeFallback);
      const dotColor = view.theme('--fg3', heroPalette.dotFallback);

      view.clear(bg);

      if (params.showMask) {
        const mask = getLetterMask(params.text, params.width, params.height);
        ctx.save();
        ctx.font = maskFontString(mask.fontPx);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = 0.06;
        ctx.fillText(params.text, params.width / 2, params.height / 2);
        ctx.restore();
      }

      // Pass 1: nodes — drawn first as faint single-pixel marks so the
      // links read on top. At thousands of particles, anything bigger or
      // darker smears into a fog. The eye should pick up the wordmark in
      // the links, not the dots.
      ctx.fillStyle = dotColor;
      ctx.globalAlpha = 0.22;
      for (let i = 0; i < data.nodes.length; i++) {
        const n = data.nodes[i];
        ctx.fillRect(n.x | 0, n.y | 0, 1, 1);
      }
      ctx.globalAlpha = 1;

      // Pass 2: links. The wordmark lives here.
      if (data.links.length > 0) {
        ctx.strokeStyle = linkColor;
        ctx.globalAlpha = 0.32;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i < data.links.length; i++) {
          const link = data.links[i];
          const a = data.nodes[link.a];
          const b = data.nodes[link.b];
          if (!a || !b) continue;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
    dims ?? undefined
  );

  React.useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;

    const apply = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      setDims({ width: w, height: h });
      if (!initializedRef.current) {
        initializedRef.current = true;
        resetWith({ width: w, height: h });
      } else {
        setParams({ width: w, height: h });
      }
    };
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [setParams, resetWith]);

  return (
    <div ref={wrapperRef} className={styles.wrapper} style={{ minHeight }}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {showPerf ? (
        <div className={styles.perf}>
          <PerformanceOverlay />
        </div>
      ) : null}
    </div>
  );
}

const HERO_GROUPS: DemoControlGroup[] = [
  {
    label: 'Particles',
    controls: [
      { type: 'range', param: 'nbNodes', label: 'Count', min: 200, max: 12000, step: 100 },
      { type: 'range', param: 'speed', label: 'Speed', min: 0, max: 2, step: 0.02 },
    ],
  },
  {
    label: 'Linking',
    controls: [
      { type: 'range', param: 'linkDistance', label: 'Range', min: 5, max: 60, step: 1 },
      {
        type: 'range',
        param: 'p',
        label: 'P (outside)',
        min: 0,
        max: 0.1,
        step: 0.001,
        format: (v) => v.toFixed(3),
      },
      {
        type: 'range',
        param: 'q',
        label: 'Q (inside)',
        min: 0,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
    ],
  },
  {
    label: 'Render',
    controls: [{ type: 'toggle', param: 'showMask', label: 'Show letter shape' }],
  },
];

export function AutomatickHeroDemo() {
  return (
    <Simulation sim={automatickHeroSim} delayMs={16}>
      <DemoSplit
        preview={<AutomatickHeroCanvas />}
        controls={<DemoControlPanel groups={HERO_GROUPS} />}
      />
    </Simulation>
  );
}

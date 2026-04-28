import React from 'react';
import { useSimulation } from 'automatick/react/hooks';

export type TimeSeriesEntry<T> = {
  color: string;
  label: string;
  accessor: (data: T) => number;
};

type Props<T> = {
  series: TimeSeriesEntry<T>[];
  /** Stacked area chart (good for population breakdowns) vs. plain lines. Default 'area'. */
  mode?: 'area' | 'line';
  height?: number;
  /** Maximum number of ticks of history to retain. Default 1000. */
  maxHistory?: number;
};

/**
 * Subscribes to the surrounding <Simulation> context and accumulates a per-tick
 * history of values pulled by the supplied accessors. Renders a stacked area
 * chart (or line series) on a canvas. History resets when tick goes back to 0.
 */
export function TimeSeries<T>({
  series,
  mode = 'area',
  height = 140,
  maxHistory = 1000,
}: Props<T>) {
  const ctxValue = useSimulation();
  const data = ctxValue.data as T;
  const tick = ctxValue.tick;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const historyRef = React.useRef<number[][]>([]);
  const lastTickRef = React.useRef(-1);
  const [pixelWidth, setPixelWidth] = React.useState(0);

  // Track the wrapper width so the canvas re-renders crisp on resize.
  React.useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    setPixelWidth(wrap.clientWidth);
    const ro = new ResizeObserver(() => setPixelWidth(wrap.clientWidth));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (tick === 0 || tick < lastTickRef.current) {
      historyRef.current = [];
    }
    if (tick !== lastTickRef.current) {
      const row = series.map((s) => s.accessor(data));
      historyRef.current.push(row);
      if (historyRef.current.length > maxHistory) {
        historyRef.current.shift();
      }
      lastTickRef.current = tick;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--bg2').trim() || '#EFEADD';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cssW = w / dpr;
    const cssH = h / dpr;
    const history = historyRef.current;
    if (history.length < 2) return;

    const n = history.length;
    const xAt = (i: number) => (i / Math.max(n - 1, 1)) * cssW;

    if (mode === 'area') {
      const stackedTops = history.map((row) =>
        row.reduce((acc, v) => acc + v, 0)
      );
      const maxTotal = Math.max(...stackedTops, 1);
      const yAt = (v: number) => cssH - (v / maxTotal) * cssH;
      // Draw bands from bottom up so each layer paints over the previous.
      const baselines = new Array<number>(n).fill(0);
      series.forEach((s, j) => {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(xAt(0), yAt(baselines[0]));
        for (let i = 0; i < n; i++) {
          ctx.lineTo(xAt(i), yAt(baselines[i]));
        }
        for (let i = n - 1; i >= 0; i--) {
          baselines[i] += history[i][j];
          ctx.lineTo(xAt(i), yAt(baselines[i]));
        }
        ctx.closePath();
        ctx.fill();
      });
    } else {
      let maxY = -Infinity;
      let minY = Infinity;
      for (const row of history) {
        for (const v of row) {
          if (v > maxY) maxY = v;
          if (v < minY) minY = v;
        }
      }
      if (maxY === minY) {
        maxY = maxY + 1;
        minY = minY - 1;
      }
      const yAt = (v: number) =>
        cssH - ((v - minY) / (maxY - minY)) * (cssH - 4) - 2;
      series.forEach((s, j) => {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xAt(0), yAt(history[0][j]));
        for (let i = 1; i < n; i++) {
          ctx.lineTo(xAt(i), yAt(history[i][j]));
        }
        ctx.stroke();
      });
    }
  }, [tick, data, series, mode, pixelWidth, maxHistory]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return (
    <div ref={wrapperRef} style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--fg3)',
        }}
      >
        {series.map((s) => (
          <span
            key={s.label}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 9,
                height: 9,
                borderRadius: 2,
                background: s.color,
              }}
            />
            <span>{s.label}</span>
            <span style={{ color: 'var(--fg1)' }}>
              {Math.round(s.accessor(data))}
            </span>
          </span>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={Math.max(1, pixelWidth) * dpr}
        height={height * dpr}
        style={{
          width: '100%',
          height,
          display: 'block',
          border: '1px solid var(--border)',
          borderRadius: 4,
          background: 'var(--bg2)',
        }}
      />
    </div>
  );
}

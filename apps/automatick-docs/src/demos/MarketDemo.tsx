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
import { TimeSeries, TimeSeriesEntry } from '../components/TimeSeries';
import marketSim from '../sims/marketSim';
import type { MarketData } from '../sims/marketSim';
import styles from './MarketDemo.module.css';

const CSS_W = 600;
const CSS_H = 600;
const UP = '#2ecc71';
const DOWN = '#e74c3c';

function MarketCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const canvasRef = useSimulationCanvas<typeof marketSim>((ctx, { data }) => {
    const cssStyles = getComputedStyle(document.documentElement);
    const bg = cssStyles.getPropertyValue('--bg3').trim() || '#14181f';
    const grid = cssStyles.getPropertyValue('--border').trim() || '#2a2f3a';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CSS_W, CSS_H);

    const history = data.priceHistory;
    const n = history.length;
    if (n < 2) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }

    let minP = Infinity;
    let maxP = -Infinity;
    for (const p of history) {
      if (p < minP) minP = p;
      if (p > maxP) maxP = p;
    }
    if (maxP === minP) {
      maxP += 1;
      minP -= 1;
    }
    const pad = (maxP - minP) * 0.08;
    minP -= pad;
    maxP += pad;

    const padX = 8;
    const padY = 20;
    const plotW = CSS_W - padX * 2;
    const plotH = CSS_H - padY * 2;
    const xAt = (i: number) => padX + (i / (n - 1)) * plotW;
    const yAt = (p: number) =>
      padY + plotH - ((p - minP) / (maxP - minP)) * plotH;

    // Gridlines.
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let g = 0; g <= 4; g++) {
      const y = padY + (g / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(CSS_W - padX, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Price line, colored per segment by direction.
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    for (let i = 1; i < n; i++) {
      ctx.strokeStyle = history[i] >= history[i - 1] ? UP : DOWN;
      ctx.beginPath();
      ctx.moveTo(xAt(i - 1), yAt(history[i - 1]));
      ctx.lineTo(xAt(i), yAt(history[i]));
      ctx.stroke();
    }

    // Latest price marker.
    const last = history[n - 1];
    ctx.fillStyle = last >= history[n - 2] ? UP : DOWN;
    ctx.beginPath();
    ctx.arc(xAt(n - 1), yAt(last), 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <div className={styles.stage}>
      <CanvasStage maxWidth={CSS_W}>
        <canvas
          ref={canvasRef}
          width={CSS_W * dpr}
          height={CSS_H * dpr}
          className={styles.canvas}
        />
      </CanvasStage>
      <div className={styles.chartWrap}>
        <TimeSeries<MarketData> mode='line' height={110} series={SERIES} />
      </div>
    </div>
  );
}

const SERIES: TimeSeriesEntry<MarketData>[] = [
  { color: '#3498db', label: 'Price', accessor: (d) => d.price },
  {
    color: '#e67e22',
    label: 'Volatility',
    accessor: (d) => d.volatility,
  },
];

function MarketStats() {
  const { data } = useSimulation<typeof marketSim>();
  return (
    <div className='group'>
      <div className='g-lbl'>Market</div>
      <div className={styles.stats}>
        <div className={styles.row}>
          <span className={styles.label}>price</span>
          <span className={styles.value}>{data.price.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>volatility</span>
          <span className={styles.value}>{data.volatility.toFixed(3)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>volume</span>
          <span className={styles.value}>{data.volume}</span>
        </div>
      </div>
    </div>
  );
}

const GROUPS: DemoControlGroup[] = [
  {
    label: 'Traders (resets)',
    controls: [
      {
        type: 'range',
        param: 'numTraders',
        label: 'Traders',
        min: 50,
        max: 500,
        step: 25,
      },
      {
        type: 'range',
        param: 'trendFollowerPct',
        label: 'Trend followers',
        min: 0,
        max: 1,
        step: 0.05,
        format: (v) => `${Math.round(v * 100)}%`,
      },
      {
        type: 'range',
        param: 'meanRevertPct',
        label: 'Mean reverters',
        min: 0,
        max: 1,
        step: 0.05,
        format: (v) => `${Math.round(v * 100)}%`,
      },
    ],
  },
  {
    label: 'Market',
    controls: [
      {
        type: 'range',
        param: 'priceImpact',
        label: 'Price impact',
        min: 0.01,
        max: 1,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        type: 'range',
        param: 'lookbackWindow',
        label: 'Lookback',
        min: 5,
        max: 50,
        step: 5,
      },
    ],
  },
];

export function MarketDemo() {
  return (
    <Simulation sim={marketSim} delayMs={50} autoplay>
      <DemoSplit
        preview={<MarketCanvas />}
        controls={
          <DemoControlPanel groups={GROUPS} extra={<MarketStats />} showStep />
        }
      />
    </Simulation>
  );
}

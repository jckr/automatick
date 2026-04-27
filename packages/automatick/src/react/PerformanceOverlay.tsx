import React from 'react';
import type { TickPerformance } from '../engine';
import { useSimulation } from './hooks';
import { EngineContext } from './EngineContext';

function formatTime(ms: number): string {
  if (ms < 0.001) return '<1\u00b5s';
  if (ms < 1) return `${Math.round(ms * 1000)}\u00b5s`;
  if (ms < 10) return `${ms.toFixed(1)}ms`;
  return `${Math.round(ms)}ms`;
}

const CHART_WIDTH = 120;
const CHART_HEIGHT = 60;

function PerfChart({
  entries,
}: {
  entries: readonly TickPerformance[];
}) {
  if (entries.length === 0) {
    return (
      <canvas
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        style={{ display: 'block', width: CHART_WIDTH, height: CHART_HEIGHT }}
      />
    );
  }

  let currentMax = 0;
  for (const e of entries) {
    const total = e.stepMs + (e.drawMs ?? 0);
    if (total > currentMax) currentMax = total;
  }
  const max = Math.max(currentMax, 0.001);

  return (
    <div style={{ position: 'relative' }}>
      {/* Max label at the dashed line */}
      <div
        style={{
          position: 'absolute',
          top: -2,
          right: 0,
          fontSize: 10,
          color: '#888',
        }}
      >
        {formatTime(max)}
      </div>
      <canvas
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        style={{ display: 'block', width: CHART_WIDTH, height: CHART_HEIGHT }}
        ref={(canvas) => {
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

          const n = entries.length;
          const chartTop = 10; // leave room for dashed line
          const chartH = CHART_HEIGHT - chartTop;

          function yPos(ms: number) {
            return chartTop + chartH - (ms / max) * chartH;
          }

          const hasAnyDraw = entries.some((e) => e.drawMs !== undefined);

          // --- Stacked area: draw on top of step ---

          // Step fill (bottom layer): gradient from blue to transparent
          const stepGrad = ctx.createLinearGradient(0, 0, 0, CHART_HEIGHT);
          stepGrad.addColorStop(0, 'rgba(79, 195, 247, 0.25)');
          stepGrad.addColorStop(1, 'rgba(79, 195, 247, 0.05)');
          ctx.fillStyle = stepGrad;
          ctx.beginPath();
          ctx.moveTo(0, CHART_HEIGHT);
          for (let i = 0; i < n; i++) {
            ctx.lineTo(
              (i / Math.max(n - 1, 1)) * CHART_WIDTH,
              yPos(entries[i].stepMs)
            );
          }
          ctx.lineTo(CHART_WIDTH, CHART_HEIGHT);
          ctx.closePath();
          ctx.fill();

          if (hasAnyDraw) {
            // Draw fill (top layer, stacked): area between step line and total line
            const drawGrad = ctx.createLinearGradient(0, 0, 0, CHART_HEIGHT);
            drawGrad.addColorStop(0, 'rgba(129, 199, 132, 0.25)');
            drawGrad.addColorStop(1, 'rgba(129, 199, 132, 0.05)');
            ctx.fillStyle = drawGrad;
            ctx.beginPath();
            // Top edge: total line (step + draw), left to right
            for (let i = 0; i < n; i++) {
              const e = entries[i];
              const x = (i / Math.max(n - 1, 1)) * CHART_WIDTH;
              ctx.lineTo(x, yPos(e.stepMs + (e.drawMs ?? 0)));
            }
            // Bottom edge: step line, right to left
            for (let i = n - 1; i >= 0; i--) {
              const x = (i / Math.max(n - 1, 1)) * CHART_WIDTH;
              ctx.lineTo(x, yPos(entries[i].stepMs));
            }
            ctx.closePath();
            ctx.fill();
          }

          // Max dashed line
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(0, chartTop);
          ctx.lineTo(CHART_WIDTH, chartTop);
          ctx.stroke();
          ctx.setLineDash([]);

          // --- Lines ---

          // Step line
          ctx.strokeStyle = '#4fc3f7';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const x = (i / Math.max(n - 1, 1)) * CHART_WIDTH;
            const y = yPos(entries[i].stepMs);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Draw line (total = step + draw), stacked on top
          if (hasAnyDraw) {
            ctx.strokeStyle = '#81c784';
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
              const e = entries[i];
              const x = (i / Math.max(n - 1, 1)) * CHART_WIDTH;
              const y = yPos(e.stepMs + (e.drawMs ?? 0));
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }}
      />
    </div>
  );
}

type ViewState = 'hidden' | 'compact' | 'expanded';

/**
 * Performance overlay with three states: hidden (pill), compact (numbers),
 * expanded (chart + numbers). Place inside a `<Simulation>`.
 */
export function PerformanceOverlay() {
  const { tick } = useSimulation();
  const engineCtx = React.useContext(EngineContext);
  const [view, setView] = React.useState<ViewState>('compact');

  const [perf, setPerf] = React.useState<readonly TickPerformance[]>([]);
  React.useEffect(() => {
    if (engineCtx) {
      setPerf(engineCtx.getPerformance());
    }
  }, [engineCtx, tick]);

  const stepValues = perf.map((p) => p.stepMs);
  const drawValues = perf
    .filter((p) => p.drawMs !== undefined)
    .map((p) => p.drawMs!);
  const hasDrawData = drawValues.length > 0;

  const avgStep =
    stepValues.length > 0
      ? stepValues.reduce((a, b) => a + b, 0) / stepValues.length
      : 0;
  const avgDraw =
    hasDrawData
      ? drawValues.reduce((a, b) => a + b, 0) / drawValues.length
      : 0;
  const avgTotal = avgStep + avgDraw;

  // Hidden state: small pill
  if (view === 'hidden') {
    return (
      <button
        type='button'
        onClick={() => setView('compact')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          background: 'rgba(20, 20, 28, 0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#ddd',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#81c784',
            boxShadow: '0 0 4px #81c784',
          }}
        />
        {formatTime(avgTotal)}
      </button>
    );
  }

  const isExpanded = view === 'expanded';

  const headerBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '2px 4px',
    fontSize: 10,
    lineHeight: 1,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 140,
        padding: '8px 10px',
        background: 'rgba(20, 20, 28, 0.92)',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1,
        border: '1px solid rgba(255,255,255,0.08)',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          color: '#999',
        }}
      >
        <span>avg / {stepValues.length}f</span>
        <span style={{ display: 'flex', gap: 0 }}>
          <button
            type='button'
            style={headerBtn}
            onClick={() =>
              setView(isExpanded ? 'compact' : 'expanded')
            }
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '\u25BC' : '\u25B6'}
          </button>
          <button
            type='button'
            style={headerBtn}
            onClick={() => setView('hidden')}
            title='Hide'
          >
            {'\u00D7'}
          </button>
        </span>
      </div>

      {/* Chart (expanded only) */}
      {isExpanded && (
        <div style={{ marginBottom: 8 }}>
          <PerfChart entries={perf} />
        </div>
      )}

      {/* Values */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasDrawData ? '1fr 1fr 1fr' : '1fr 1fr',
        }}
      >
        <div>
          <div style={{ color: '#4fc3f7', marginBottom: 4 }}>step</div>
          <div style={{ color: '#ddd' }}>{formatTime(avgStep)}</div>
        </div>
        {hasDrawData && (
          <div>
            <div style={{ color: '#81c784', marginBottom: 4 }}>draw</div>
            <div style={{ color: '#ddd' }}>{formatTime(avgDraw)}</div>
          </div>
        )}
        <div>
          <div style={{ color: '#999', marginBottom: 4 }}>total</div>
          <div style={{ color: '#ddd' }}>{formatTime(avgTotal)}</div>
        </div>
      </div>
    </div>
  );
}

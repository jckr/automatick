import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import mazeSim from '../sims/mazeSim';
import type { MazeGridKind } from '../sims/mazeSim';
import { drawMazeFrame } from '../sims/mazeCanvas';

const GRID_OPTIONS: { value: MazeGridKind; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'hexagonal', label: 'Hexagonal' },
  { value: 'triangular', label: 'Triangular' },
  { value: 'circle', label: 'Circle' },
];

function GridTypeSelector() {
  const { params, resetWith } = useSimulation<typeof mazeSim>();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ minWidth: 120, opacity: 0.9, fontSize: 13 }}>
        Grid type
      </span>
      {GRID_OPTIONS.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <input
            type="radio"
            name="maze-grid-type"
            value={opt.value}
            checked={params.grid === opt.value}
            onChange={() => resetWith({ grid: opt.value })}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function MazeCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssSize = 600;
  const lastDrawnTickRef = React.useRef(-1);

  const canvasRef = useSimulationCanvas<typeof mazeSim>((ctx, { data, params, tick }) => {
    const scale = (cssSize * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    if (tick === 0) {
      // Full redraw on init/reset
      lastDrawnTickRef.current = -1;
    }

    // Draw all links since last render.
    // drawMazeFrame draws links[tick - ticksPerAnimation .. tick-1],
    // so we set ticksPerAnimation to cover everything since lastDrawnTick.
    const gap = tick - lastDrawnTickRef.current;
    const overrideParams = { ...params, ticksPerAnimation: gap };
    drawMazeFrame({
      ctx,
      pixelWidth: params.width,
      pixelHeight: params.height,
      tick,
      params: overrideParams,
      data,
    });
    lastDrawnTickRef.current = tick;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={cssSize * dpr}
      height={cssSize * dpr}
      style={{ border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, width: '100%', height: 'auto' }}
    />
  );
}

export function MazeDemo() {
  const [showPerf, setShowPerf] = React.useState(true);
  const [ticksPerFrame, setTicksPerFrame] = React.useState(1);

  return (
    <Simulation sim={mazeSim} maxTime={50000} delayMs={10} ticksPerFrame={ticksPerFrame}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          maxTime={50000}
          showStepButton
          controls={[
            {
              type: 'toggle',
              param: 'drawItem',
              label: 'Draw cells',
            },
          ]}
        />
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
          <span style={{ minWidth: 120, opacity: 0.9 }}>Ticks per frame</span>
          <input
            type='range'
            min={1}
            max={50}
            step={1}
            value={ticksPerFrame}
            onChange={(e) => setTicksPerFrame(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', opacity: 0.8 }}>
            {ticksPerFrame}
          </span>
        </label>
        <GridTypeSelector />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <MazeCanvas />
          {showPerf && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <PerformanceOverlay />
            </div>
          )}
        </div>
      </div>
    </Simulation>
  );
}

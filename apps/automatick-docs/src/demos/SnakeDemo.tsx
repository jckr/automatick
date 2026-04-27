import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import snakeSim from '../sims/snakeSim';
import { drawSnakeFrame } from '../sims/snakeCanvas';

type SpeedSetting = 'normal' | 'fast' | 'very fast';

const SPEED_CONFIG: Record<SpeedSetting, { delayMs: number; ticksPerFrame: number }> = {
  normal: { delayMs: 100, ticksPerFrame: 1 },
  fast: { delayMs: 0, ticksPerFrame: 1 },
  'very fast': { delayMs: 0, ticksPerFrame: 20 },
};

function SnakeCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssWidth = 600;
  const { params } = useSimulation<typeof snakeSim>();

  const pixelWidth = params.width * params.cellSize;
  const pixelHeight = params.height * params.cellSize;
  const cssHeight = cssWidth * (pixelHeight / pixelWidth);

  const canvasRef = useSimulationCanvas<typeof snakeSim>((ctx, { data, params }) => {
    const pw = params.width * params.cellSize;
    const ph = params.height * params.cellSize;
    const scale = (cssWidth * dpr) / pw;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    drawSnakeFrame({
      ctx,
      pixelWidth: pw,
      pixelHeight: ph,
      cellSize: params.cellSize,
      cols: params.width,
      rows: params.height,
      displayGrid: params.displayGrid,
      displayCircuit: params.displayCircuit,
      displayHead: params.displayHead,
      data,
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <canvas
      ref={canvasRef}
      width={cssWidth * dpr}
      height={cssHeight * dpr}
      style={{ border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, width: '100%', height: 'auto' }}
    />
  );
}

function SnakeGridControls() {
  const { params, resetWith } = useSimulation<typeof snakeSim>();

  const handleChange = (patch: { width?: number; height?: number }) => {
    resetWith(patch);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
        <span style={{ minWidth: 120, opacity: 0.9 }}>Grid width</span>
        <input
          type='range'
          min={6}
          max={50}
          step={1}
          value={params.width}
          onChange={(e) => handleChange({ width: Number(e.target.value) })}
          style={{ flex: 1 }}
        />
        <span style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', opacity: 0.8 }}>
          {params.width}
        </span>
      </label>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
        <span style={{ minWidth: 120, opacity: 0.9 }}>Grid height</span>
        <input
          type='range'
          min={6}
          max={50}
          step={1}
          value={params.height}
          onChange={(e) => handleChange({ height: Number(e.target.value) })}
          style={{ flex: 1 }}
        />
        <span style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', opacity: 0.8 }}>
          {params.height}
        </span>
      </label>
    </div>
  );
}

function SnakeDisplayControls() {
  const { params, setParams } = useSimulation<typeof snakeSim>();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontWeight: 500 }}>Display</label>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type='checkbox'
            checked={params.displayHead}
            onChange={(e) => setParams({ displayHead: e.target.checked })}
          />
          Show head
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type='checkbox'
            checked={params.displayGrid}
            onChange={(e) => setParams({ displayGrid: e.target.checked })}
          />
          Show grid
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type='checkbox'
            checked={params.displayCircuit}
            onChange={(e) => setParams({ displayCircuit: e.target.checked })}
          />
          Show circuit
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type='checkbox'
            checked={params.safeMode}
            onChange={(e) => setParams({ safeMode: e.target.checked })}
          />
          Safe mode
        </label>
      </div>
    </div>
  );
}

export function SnakeDemo() {
  const [showPerf, setShowPerf] = React.useState(true);
  const [speed, setSpeed] = React.useState<SpeedSetting>('fast');
  const { delayMs, ticksPerFrame } = SPEED_CONFIG[speed];

  return (
    <Simulation
      sim={snakeSim}
      delayMs={delayMs}
      ticksPerFrame={ticksPerFrame}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls showStepButton />
        <SnakeGridControls />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontWeight: 500 }}>Speed</label>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['normal', 'fast', 'very fast'] as SpeedSetting[]).map((s) => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type='radio'
                  name='snake-speed'
                  checked={speed === s}
                  onChange={() => setSpeed(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>
        <SnakeDisplayControls />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type='checkbox' checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <SnakeCanvas />
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

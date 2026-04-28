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
import snakeSim from '../sims/snakeSim';
import { drawSnakeFrame } from '../sims/snakeCanvas';

type SpeedSetting = 'normal' | 'fast' | 'very fast';

const SPEED_CONFIG: Record<SpeedSetting, { delayMs: number; ticksPerFrame: number }> = {
  normal: { delayMs: 100, ticksPerFrame: 1 },
  fast: { delayMs: 0, ticksPerFrame: 1 },
  'very fast': { delayMs: 0, ticksPerFrame: 20 },
};

const CSS_WIDTH = 600;

function SnakeCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const { params } = useSimulation<typeof snakeSim>();

  const pixelWidth = params.width * params.cellSize;
  const pixelHeight = params.height * params.cellSize;
  const cssHeight = CSS_WIDTH * (pixelHeight / pixelWidth);

  const canvasRef = useSimulationCanvas<typeof snakeSim>((ctx, { data, params }) => {
    const pw = params.width * params.cellSize;
    const scale = (CSS_WIDTH * dpr) / pw;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawSnakeFrame({
      ctx,
      pixelWidth: pw,
      pixelHeight: params.height * params.cellSize,
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
    <CanvasStage maxWidth={CSS_WIDTH}>
      <canvas
        ref={canvasRef}
        width={CSS_WIDTH * dpr}
        height={cssHeight * dpr}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
      />
    </CanvasStage>
  );
}

function SnakeGridControls() {
  const { params, resetWith } = useSimulation<typeof snakeSim>();
  return (
    <div className='group'>
      <div className='g-lbl'>Grid (resets)</div>
      <div className='ctrl'>
        <label htmlFor='snake-w'>Width</label>
        <span className='val'>{params.width}</span>
        <input
          id='snake-w'
          type='range'
          min={6}
          max={50}
          step={1}
          value={params.width}
          onChange={(e) => resetWith({ width: Number(e.target.value) })}
        />
      </div>
      <div className='ctrl'>
        <label htmlFor='snake-h'>Height</label>
        <span className='val'>{params.height}</span>
        <input
          id='snake-h'
          type='range'
          min={6}
          max={50}
          step={1}
          value={params.height}
          onChange={(e) => resetWith({ height: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}

const SNAKE_GROUPS: DemoControlGroup[] = [
  {
    label: 'Render',
    controls: [
      { type: 'toggle', param: 'displayHead', label: 'Show head' },
      { type: 'toggle', param: 'displayGrid', label: 'Show grid' },
      { type: 'toggle', param: 'displayCircuit', label: 'Show circuit' },
      { type: 'toggle', param: 'safeMode', label: 'Safe mode' },
    ],
  },
];

export function SnakeDemo() {
  const [speed, setSpeed] = React.useState<SpeedSetting>('fast');
  const { delayMs, ticksPerFrame } = SPEED_CONFIG[speed];

  const SpeedGroup = (
    <div className='group'>
      <div className='g-lbl'>Speed</div>
      <div className='chips'>
        {(['normal', 'fast', 'very fast'] as SpeedSetting[]).map((s) => (
          <button
            key={s}
            type='button'
            className={`chip${speed === s ? ' active' : ''}`}
            onClick={() => setSpeed(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Simulation sim={snakeSim} delayMs={delayMs} ticksPerFrame={ticksPerFrame}>
      <DemoSplit
        preview={<SnakeCanvas />}
        controls={
          <DemoControlPanel
            groups={SNAKE_GROUPS}
            extra={
              <>
                <SnakeGridControls />
                {SpeedGroup}
              </>
            }
            showStep
          />
        }
      />
    </Simulation>
  );
}

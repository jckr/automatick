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
import mazeSim from '../sims/mazeSim';
import type { MazeGridKind } from '../sims/mazeSim';
import { drawMazeFrame } from '../sims/mazeCanvas';

const CSS_SIZE = 600;

function GridTypeGroup() {
  const { params, resetWith } = useSimulation<typeof mazeSim>();
  const options: { value: MazeGridKind; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'hexagonal', label: 'Hex' },
    { value: 'triangular', label: 'Triangular' },
    { value: 'circle', label: 'Circle' },
  ];
  return (
    <div className='group'>
      <div className='g-lbl'>Grid (resets)</div>
      <div className='chips'>
        {options.map((opt) => (
          <button
            key={opt.value}
            type='button'
            className={`chip${params.grid === opt.value ? ' active' : ''}`}
            onClick={() => resetWith({ grid: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MazeCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const lastDrawnTickRef = React.useRef(-1);

  const canvasRef = useSimulationCanvas<typeof mazeSim>((ctx, { data, params, tick }) => {
    const scale = (CSS_SIZE * dpr) / params.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (tick === 0) lastDrawnTickRef.current = -1;
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
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas
        ref={canvasRef}
        width={CSS_SIZE * dpr}
        height={CSS_SIZE * dpr}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
      />
    </CanvasStage>
  );
}

const MAZE_GROUPS: DemoControlGroup[] = [
  {
    label: 'Render',
    controls: [
      { type: 'toggle', param: 'drawItem', label: 'Draw cells' },
    ],
  },
];

export function MazeDemo() {
  const [ticksPerFrame, setTicksPerFrame] = React.useState(1);

  const SpeedGroup = (
    <div className='group'>
      <div className='g-lbl'>Speed</div>
      <div className='ctrl'>
        <label htmlFor='maze-tpf'>Ticks / frame</label>
        <span className='val'>{ticksPerFrame}</span>
        <input
          id='maze-tpf'
          type='range'
          min={1}
          max={50}
          step={1}
          value={ticksPerFrame}
          onChange={(e) => setTicksPerFrame(Number(e.target.value))}
        />
      </div>
    </div>
  );

  return (
    <Simulation sim={mazeSim} maxTime={50000} delayMs={10} ticksPerFrame={ticksPerFrame}>
      <DemoSplit
        preview={<MazeCanvas />}
        controls={
          <DemoControlPanel
            groups={MAZE_GROUPS}
            extra={
              <>
                {SpeedGroup}
                <GridTypeGroup />
              </>
            }
            showStep
          />
        }
      />
    </Simulation>
  );
}

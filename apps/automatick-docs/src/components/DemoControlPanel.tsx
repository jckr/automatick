import React from 'react';
import { useSimulation } from 'automatick/react/hooks';
import { PauseIcon, PlayIcon } from '../layout/icons';

export type RangeControl = {
  type: 'range';
  param: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
};

export type ToggleControl = {
  type: 'toggle';
  param: string;
  label: string;
};

export type ChipsControl<T extends string | number = string | number> = {
  type: 'chips';
  param: string;
  label: string;
  options: Array<{ value: T; label: string }>;
};

export type DemoControl = RangeControl | ToggleControl | ChipsControl;

export type DemoControlGroup = {
  label?: string;
  controls: DemoControl[];
};

type Props = {
  groups: DemoControlGroup[];
  /** Show transport row (play/pause + tick). Default true. */
  showTransport?: boolean;
  /** Show reset button in transport. Default true. */
  showReset?: boolean;
  /** Show step-once button (advances one tick when paused). Default false. */
  showStep?: boolean;
  /** Extra content rendered after the standard groups (custom panels, bit toggles, etc.). */
  extra?: React.ReactNode;
};

function pad(n: number, width: number) {
  return String(n).padStart(width, '0');
}

function ResetIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M3 12a9 9 0 1 0 3-6.7' />
      <polyline points='3 4 3 10 9 10' />
    </svg>
  );
}

function StepIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <polygon points='5 4 15 12 5 20 5 4' fill='currentColor' />
      <line x1='19' x2='19' y1='5' y2='19' />
    </svg>
  );
}

function Transport({
  showReset = true,
  showStep = false,
}: {
  showReset?: boolean;
  showStep?: boolean;
}) {
  const { status, play, pause, resetWith, advance, tick } = useSimulation();
  const isPlaying = status === 'playing';
  const canPlay = status === 'idle' || status === 'paused';
  const canStep = status === 'idle' || status === 'paused';

  return (
    <div className='transport'>
      <button
        type='button'
        className='play'
        onClick={isPlaying ? pause : play}
        disabled={!isPlaying && !canPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      {showStep ? (
        <button
          type='button'
          className='icon-mini'
          onClick={() => advance(1)}
          disabled={!canStep}
          aria-label='Step once'
          title='Step once'
        >
          <StepIcon />
        </button>
      ) : null}
      {showReset ? (
        <button
          type='button'
          className='icon-mini'
          onClick={() => resetWith()}
          aria-label='Reset'
          title='Reset'
        >
          <ResetIcon />
        </button>
      ) : null}
      <span className='tick-readout'>
        tick <span className='num'>{pad(tick, 4)}</span>
      </span>
    </div>
  );
}

function RangeRow({ control }: { control: RangeControl }) {
  const { params, setParams } = useSimulation<unknown, Record<string, unknown>>();
  const raw = params[control.param];
  const value = typeof raw === 'number' ? raw : Number(raw) || control.min;
  const fillPct =
    ((value - control.min) / (control.max - control.min)) * 100;
  const display = control.format
    ? control.format(value)
    : Number.isInteger(value)
      ? String(value)
      : value.toFixed(2);
  const id = `ctrl-${control.param}`;

  return (
    <div className='ctrl'>
      <label htmlFor={id}>{control.label}</label>
      <span className='val'>{display}</span>
      <input
        id={id}
        type='range'
        min={control.min}
        max={control.max}
        step={control.step ?? 1}
        value={value}
        onChange={(e) =>
          setParams({ [control.param]: Number(e.target.value) })
        }
        style={{ ['--fill' as string]: `${fillPct}%` }}
      />
    </div>
  );
}

function ToggleRow({ control }: { control: ToggleControl }) {
  const { params, setParams } = useSimulation<unknown, Record<string, unknown>>();
  const checked = Boolean(params[control.param]);
  return (
    <div className='ctrl' style={{ marginBottom: 14 }}>
      <label
        htmlFor={`ctrl-${control.param}`}
        style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between' }}
      >
        <span>{control.label}</span>
        <button
          id={`ctrl-${control.param}`}
          type='button'
          className={`chip${checked ? ' accent' : ''}`}
          onClick={() => setParams({ [control.param]: !checked })}
          role='switch'
          aria-checked={checked}
        >
          {checked ? 'on' : 'off'}
        </button>
      </label>
    </div>
  );
}

function ChipsRow({ control }: { control: ChipsControl }) {
  const { params, setParams } = useSimulation<unknown, Record<string, unknown>>();
  const current = params[control.param];
  return (
    <div className='ctrl' style={{ gridTemplateColumns: '1fr', gap: 8 }}>
      <label style={{ marginBottom: 2 }}>{control.label}</label>
      <div className='chips'>
        {control.options.map((opt) => (
          <button
            key={String(opt.value)}
            type='button'
            className={`chip${current === opt.value ? ' active' : ''}`}
            onClick={() => setParams({ [control.param]: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ControlRow({ control }: { control: DemoControl }) {
  switch (control.type) {
    case 'range':
      return <RangeRow control={control} />;
    case 'toggle':
      return <ToggleRow control={control} />;
    case 'chips':
      return <ChipsRow control={control} />;
  }
}

export function DemoControlPanel({
  groups,
  showTransport = true,
  showReset = true,
  showStep = false,
  extra,
}: Props) {
  return (
    <div className='pg-controls'>
      {showTransport ? (
        <Transport showReset={showReset} showStep={showStep} />
      ) : null}
      {groups.map((g, i) => (
        <div key={i} className='group'>
          {g.label ? <div className='g-lbl'>{g.label}</div> : null}
          {g.controls.map((c, j) => (
            <ControlRow key={`${c.param}-${j}`} control={c} />
          ))}
        </div>
      ))}
      {extra}
    </div>
  );
}

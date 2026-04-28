import React from 'react';

type Props = {
  /** Sim content (e.g. a <Simulation> with a render child, or a static SVG). */
  children: React.ReactNode;
  /** Mono uppercase caption inside the stage, top-left (e.g. "sim · boids · 120 agents"). */
  label?: string;
  /** Stage height variant. Default = ~360px. */
  height?: 'short' | 'tall';
  /** Show the bottom controls bar (default true). */
  showControls?: boolean;
  /** Tick number shown in the bottom-right of the controls bar. */
  tick?: number;
  /** When true, the live dot pulses; when false, hide it. */
  live?: boolean;
};

function pad(n: number, width: number) {
  return String(n).padStart(width, '0');
}

export function SimFrame({
  children,
  label,
  height,
  showControls = true,
  tick,
  live = true,
}: Props) {
  const stageClass =
    'stage' + (height === 'short' ? ' short' : height === 'tall' ? ' tall' : '');

  return (
    <div className='sim-frame'>
      <div className={stageClass}>
        {children}
        {label ? <div className='sim-label'>{label}</div> : null}
      </div>
      {showControls ? (
        <div className='ctrls'>
          {live ? <span className='live-dot'>running</span> : null}
          <div className='spacer' />
          {tick !== undefined ? (
            <span className='frame-count'>
              tick <span className='num'>{pad(tick, 4)}</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

import React from 'react';

type Meta = { label: string; value: string; live?: boolean };

type Props = {
  title: string;
  /** Right-side meta strip (file name, count, status). */
  meta?: Meta[];
  /** Description prose, rendered above the demo. The first paragraph gets lede styling. */
  description?: React.ReactNode;
  children: React.ReactNode;
};

export function ExamplePage({ title, meta, description, children }: Props) {
  return (
    <div className='playground'>
      <header className='pg-header'>
        <div>
          <h1>{title}</h1>
        </div>
        {meta && meta.length > 0 ? (
          <div className='meta'>
            {meta.map((m, i) => (
              <span key={i} className={m.live ? 'live' : undefined}>
                {m.label} · <span className='now'>{m.value}</span>
              </span>
            ))}
          </div>
        ) : null}
      </header>
      {children}
      {description ? (
        <div className='pg-intro' style={{ marginTop: 32 }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

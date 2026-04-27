import React from 'react';

type Kind = 'function' | 'component' | 'hook' | 'type';

type Props = {
  kind: Kind;
  module: string;
  since?: string;
  children: React.ReactNode;
};

const KIND_LABEL: Record<Kind, string> = {
  function: 'function',
  component: 'component',
  hook: 'hook',
  type: 'type',
};

export function ApiPage({ kind, module, since = '0.0.1', children }: Props) {
  return (
    <>
      <div
        className='eyebrow'
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span>
          {KIND_LABEL[kind]} · stable since v{since}
        </span>
        <span className='mono' style={{ color: 'var(--fg3)' }}>
          {module}
        </span>
      </div>
      {children}
    </>
  );
}

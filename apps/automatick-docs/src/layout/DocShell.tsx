import React from 'react';
import { Sidebar } from './Sidebar';
import { Toc } from './Toc';

type Variant = 'full' | 'no-toc' | 'no-sidebar' | 'flush' | 'playground';

type Props = {
  variant?: Variant;
  children: React.ReactNode;
};

export function DocShell({ variant = 'full', children }: Props) {
  if (variant === 'flush') {
    return <>{children}</>;
  }
  if (variant === 'playground') {
    return (
      <div className='shell shell-playground'>
        <Sidebar />
        <main>{children}</main>
      </div>
    );
  }
  const className = `shell${variant === 'no-toc' ? ' no-toc' : ''}${
    variant === 'no-sidebar' ? ' no-sidebar' : ''
  }`;
  return (
    <div className={className}>
      {variant !== 'no-sidebar' && <Sidebar />}
      <main className='content'>{children}</main>
      {variant !== 'no-toc' && <Toc />}
    </div>
  );
}

import React from 'react';
import { Outlet } from 'react-router-dom';
import { DocShell } from './DocShell';

type Variant = 'full' | 'no-toc' | 'no-sidebar' | 'flush' | 'playground';

export function ShellRoute({ variant }: { variant: Variant }) {
  return (
    <DocShell variant={variant}>
      <Outlet />
    </DocShell>
  );
}

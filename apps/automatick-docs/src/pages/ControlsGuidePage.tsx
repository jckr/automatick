import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './controls-guide.mdx';

export function ControlsGuidePage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Controls' },
      ]}
      prev={{ label: 'Using the hook', to: '/guide/using-the-hook' }}
      next={{ label: 'Canvas rendering', to: '/guide/canvas-rendering' }}
    >
      <Content />
    </GuidePage>
  );
}

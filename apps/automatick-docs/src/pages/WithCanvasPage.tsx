import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './with-canvas.mdx';

export function WithCanvasPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'With Canvas' },
      ]}
      prev={{ label: 'With React', to: '/guide/with-react' }}
      next={{ label: 'With Worker', to: '/guide/with-worker' }}
    >
      <Content />
    </GuidePage>
  );
}

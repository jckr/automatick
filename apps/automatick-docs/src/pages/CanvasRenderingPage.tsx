import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './canvas-rendering.mdx';

export function CanvasRenderingPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Canvas rendering' },
      ]}
      prev={{ label: 'Controls', to: '/guide/controls' }}
    >
      <Content />
    </GuidePage>
  );
}

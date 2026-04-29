import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './visualization-patterns.mdx';

export function VisualizationPatternsPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Visualization patterns' },
      ]}
      prev={{ label: 'Canvas rendering', to: '/guide/canvas-rendering' }}
    >
      <Content />
    </GuidePage>
  );
}

import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './with-worker.mdx';

export function WithWorkerPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'With Worker' },
      ]}
      prev={{ label: 'With Canvas', to: '/guide/with-canvas' }}
      next={{ label: 'Tutorial', to: '/guide/tutorial' }}
    >
      <Content />
    </GuidePage>
  );
}

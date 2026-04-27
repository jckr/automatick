import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './getting-started.mdx';

export function GettingStartedPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Getting started' },
      ]}
      next={{ label: 'Tutorial', to: '/guide/tutorial' }}
    >
      <Content />
    </GuidePage>
  );
}

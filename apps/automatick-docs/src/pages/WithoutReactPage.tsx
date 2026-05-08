import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './without-react.mdx';

export function WithoutReactPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Without React' },
      ]}
      prev={{ label: 'Getting started', to: '/guide/getting-started' }}
      next={{ label: 'Tutorial', to: '/guide/tutorial' }}
    >
      <Content />
    </GuidePage>
  );
}

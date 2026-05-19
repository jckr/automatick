import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './with-react.mdx';

export function WithReactPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'With React' },
      ]}
      prev={{ label: 'Without React', to: '/guide/without-react' }}
      next={{ label: 'With Canvas', to: '/guide/with-canvas' }}
    >
      <Content />
    </GuidePage>
  );
}

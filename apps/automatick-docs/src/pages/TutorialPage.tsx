import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './tutorial.mdx';

export function TutorialPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Tutorial' },
      ]}
      prev={{ label: 'With React', to: '/guide/with-react' }}
      next={{ label: 'Defining a simulation', to: '/guide/defining-a-sim' }}
    >
      <Content />
    </GuidePage>
  );
}

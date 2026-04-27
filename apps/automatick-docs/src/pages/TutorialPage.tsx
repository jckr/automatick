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
      prev={{ label: 'Getting started', to: '/guide/getting-started' }}
      next={{ label: 'Defining a simulation', to: '/guide/defining-a-sim' }}
    >
      <Content />
    </GuidePage>
  );
}

import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './using-the-hook.mdx';

export function UsingTheHookPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Using the hook' },
      ]}
      prev={{ label: 'Simulation component', to: '/guide/simulation-component' }}
      next={{ label: 'Controls', to: '/guide/controls' }}
    >
      <Content />
    </GuidePage>
  );
}

import React from 'react';
import { ApiPage } from '../../layout/ApiPage';
import Content from './create-engine.mdx';

export function CreateEngineApiPage() {
  return (
    <ApiPage kind='function' module='automatick/engine'>
      <Content />
    </ApiPage>
  );
}

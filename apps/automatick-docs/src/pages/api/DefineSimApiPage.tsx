import React from 'react';
import { ApiPage } from '../../layout/ApiPage';
import Content from './define-sim.mdx';

export function DefineSimApiPage() {
  return (
    <ApiPage kind='function' module='automatick/sim'>
      <Content />
    </ApiPage>
  );
}

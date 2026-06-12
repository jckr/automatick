import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { LSystemDemo } from '../../demos/LSystemDemo';

export function LSystemPage() {
  return (
    <ExamplePage
      title='L-Systems'
      description={
        <>
          <p>
            An L-system (Lindenmayer system) is a string-rewriting grammar. It
            starts from an axiom and, each generation, replaces every symbol with
            its production rule. The result grows exponentially, encoding
            surprisingly intricate structure in a handful of rules.
          </p>
          <p>
            Each generation, the current string is interpreted as turtle
            graphics: <code>F</code> draws forward, <code>+</code> and{' '}
            <code>-</code> turn, and <code>[</code> / <code>]</code> push and pop
            the turtle state to make branches. The drawing is auto-fit to the
            canvas. Pick a preset and watch the structure unfold one rewrite at a
            time.
          </p>
        </>
      }
    >
      <LSystemDemo />
    </ExamplePage>
  );
}

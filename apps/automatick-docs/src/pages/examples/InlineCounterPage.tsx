import { ExamplePage } from '../../layout/ExamplePage';
import { InlineCounterDemo } from '../../components/InlineCounterDemo';

export function InlineCounterPage() {
  return (
    <ExamplePage
      title='Inline counter'
      description={
        <>
          <p>
            The smallest possible automatick example: <code>init</code>,{' '}
            <code>step</code>, and a render component. No <code>defineSim</code>{' '}
            wrapper, no params.
          </p>
          <p>
            <code>&lt;Simulation&gt;</code> takes the sim parts as props
            directly, so a one-page demo doesn't need a separate module file.
          </p>
        </>
      }
    >
      <InlineCounterDemo />
    </ExamplePage>
  );
}

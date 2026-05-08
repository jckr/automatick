import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { StandardControls } from 'automatick/react/controls';
import styles from './InlineCounterDemo.module.css';

function Display() {
  const { data, tick } = useSimulation<{ count: number }>();
  return (
    <div className={styles.wrap}>
      <div className={styles.readout} data-testid='inline-counter-value'>
        count = {data.count}
      </div>
      <div className={styles.tick} data-testid='inline-counter-tick'>
        tick {tick}
      </div>
    </div>
  );
}

/**
 * Smallest possible automatick example — sim parts passed directly as props,
 * no `defineSim` wrapper, no params. Used in getting-started docs and as the
 * fixture for the inline-form e2e test.
 */
export function InlineCounterDemo() {
  return (
    <Simulation
      init={{ count: 0 }}
      step={({ data }) => ({ count: data.count + 1 })}
      delayMs={50}
    >
      <Display />
      <StandardControls showStepButton />
    </Simulation>
  );
}

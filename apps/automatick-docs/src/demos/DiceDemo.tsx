import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import diceSim from '../sims/diceSim';
import styles from './DiceDemo.module.css';

function Die(props: { value: number }) {
  const { value } = props;
  return (
    <div className={styles.die}>
      {value !== 1 && (
        <div className={`${styles.dot} ${styles.top} ${styles.left}`} />
      )}
      {value > 3 && (
        <div className={`${styles.dot} ${styles.top} ${styles.right}`} />
      )}
      {value === 6 && (
        <div className={`${styles.dot} ${styles.mid} ${styles.left}`} />
      )}
      {value % 2 === 1 && (
        <div className={`${styles.dot} ${styles.mid} ${styles.center}`} />
      )}
      {value === 6 && (
        <div className={`${styles.dot} ${styles.mid} ${styles.right}`} />
      )}
      {value > 3 && (
        <div className={`${styles.dot} ${styles.bottom} ${styles.left}`} />
      )}
      {value !== 1 && (
        <div className={`${styles.dot} ${styles.bottom} ${styles.right}`} />
      )}
    </div>
  );
}

function Bar(props: {
  label: number;
  nbRolls: number;
  max: number;
  nbValues: number;
}) {
  const height = props.max ? (140 * props.nbRolls) / props.max : 0;
  const width = 420 / props.nbValues;
  return (
    <div className={styles.barCol} style={{ width }}>
      <div className={styles.barFrame}>
        <div className={styles.bar} style={{ width: width * 0.78, height }} />
      </div>
      <div
        className={styles.barLabel}
        style={{ fontSize: Math.min(420 / (1.5 * props.nbValues), 12) }}
      >
        {props.label}
      </div>
    </div>
  );
}

function DiceView() {
  const { data, params } = useSimulation<typeof diceSim>();
  const minValue = Number(params.nbDice);
  const maxValue = minValue * 6;
  const nbValues = maxValue - minValue + 1;
  const { rolls, totals } = data;
  let max = 0;
  const bars = Array.from({ length: nbValues }, (_, i) => {
    const label = minValue + i;
    const nbRolls = totals[label] ?? 0;
    max = Math.max(max, nbRolls);
    return { label, nbRolls };
  });

  return (
    <div className={styles.view}>
      <div className={styles.diceRow}>
        {rolls.map((value, index) => (
          <Die key={`die-${index}-${value}`} value={value} />
        ))}
      </div>
      <div className={styles.barsRow}>
        {bars.map((bar) => (
          <Bar
            key={bar.label}
            label={bar.label}
            nbRolls={bar.nbRolls}
            max={max}
            nbValues={nbValues}
          />
        ))}
      </div>
    </div>
  );
}

const DICE_GROUPS: DemoControlGroup[] = [
  {
    label: 'Roll',
    controls: [
      {
        type: 'range',
        param: 'nbDice',
        label: 'Dice per roll',
        min: 1,
        max: 6,
        step: 1,
      },
    ],
  },
];

export function DiceDemo() {
  return (
    <Simulation sim={diceSim} maxTime={1000} delayMs={0}>
      <DemoSplit
        preview={<DiceView />}
        controls={<DemoControlPanel groups={DICE_GROUPS} showStep />}
      />
    </Simulation>
  );
}

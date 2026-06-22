import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import automata1dSim from '../sims/automata1dSim';
import type { Automata1dData } from '../sims/automata1dSim';
import styles from './Automata1dDemo.module.css';

const CELL = 8;

function AutomataBitToggle(props: { bit: number }) {
  const { params, setParams } = useSimulation<typeof automata1dSim>();
  const increment = 1 << props.bit;
  const set = (increment & params.rule) !== 0;
  const left = (4 & props.bit) !== 0;
  const mid = (2 & props.bit) !== 0;
  const right = (1 & props.bit) !== 0;

  const cellClass = (on: boolean) =>
    on ? `${styles.miniCell} ${styles.on}` : styles.miniCell;

  return (
    <button
      type='button'
      onClick={() => {
        const updatedRule = set ? params.rule - increment : params.rule + increment;
        setParams({ rule: updatedRule });
      }}
      className={styles.bitToggle}
    >
      <div className={styles.bitToggleRow}>
        <div className={cellClass(left)} />
        <div className={cellClass(mid)} />
        <div className={cellClass(right)} />
      </div>
      <div className={cellClass(set)} />
    </button>
  );
}

function BitToggleGrid() {
  return (
    <div className='group'>
      <div className='g-lbl'>Rule bits</div>
      <div className={styles.bitGrid}>
        {[7, 6, 5, 4, 3, 2, 1, 0].map((bit) => (
          <AutomataBitToggle key={bit} bit={bit} />
        ))}
      </div>
    </div>
  );
}

function Automata1dView() {
  const { data, tick, params } = useSimulation<typeof automata1dSim>();
  const { rows, cols } = params;

  const historyRef = React.useRef<Map<number, Automata1dData>>(new Map());
  React.useEffect(() => {
    if (tick === 0) historyRef.current = new Map();
    historyRef.current.set(tick, data);
  }, [tick, data]);

  const nbRows = Math.min(tick + 1, rows);

  return (
    <div className={styles.view}>
      <div
        className={styles.board}
        style={{
          height: rows * (CELL + 2),
          width: cols * (CELL + 2),
        }}
      >
        {[...Array(nbRows).keys()].map((rowIndex) => {
          const ts = tick - nbRows + 1 + rowIndex;
          const row = historyRef.current.get(ts);
          if (!row) return null;
          return (
            <div
              key={`row-${ts}`}
              className={styles.row}
              style={{ top: (CELL + 2) * rowIndex }}
            >
              {row.map((cell, x) => (
                <div
                  key={`c-${ts}-${x}`}
                  className={cell ? `${styles.cell} ${styles.on}` : styles.cell}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const AUTOMATA_GROUPS: DemoControlGroup[] = [
  {
    label: 'Rule',
    controls: [
      {
        type: 'range',
        param: 'rule',
        label: 'Rule number',
        min: 0,
        max: 255,
        step: 1,
      },
    ],
  },
  {
    label: 'Seed',
    controls: [
      {
        type: 'chips',
        param: 'firstLine',
        label: 'First line',
        options: [
          { value: 'blank', label: 'Blank' },
          { value: 'full', label: 'Full' },
          { value: 'random', label: 'Random' },
        ],
      },
    ],
  },
];

export function Automata1dDemo() {
  return (
    <Simulation sim={automata1dSim} pauseWhenHidden maxTime={500} delayMs={40}>
      <DemoSplit
        preview={<Automata1dView />}
        controls={
          <DemoControlPanel
            groups={AUTOMATA_GROUPS}
            showStep
            extra={<BitToggleGrid />}
          />
        }
      />
    </Simulation>
  );
}

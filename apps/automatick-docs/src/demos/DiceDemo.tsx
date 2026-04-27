import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import diceSim from '../sims/diceSim';

function Die(props: { value: number }) {
  const dotStyle: React.CSSProperties = {
    background: 'var(--fg1)',
    width: 4,
    height: 4,
    borderRadius: '100%',
    position: 'absolute',
  };
  const top = { top: 4 };
  const bottom = { bottom: 4 };
  const right = { right: 4 };
  const left = { left: 4 };
  const mid = { top: 11 };
  const center = { left: 11 };
  const { value } = props;
  return (
    <div
      style={{
        width: 26,
        height: 26,
        marginRight: 10,
        position: 'relative',
        border: '1px solid var(--fg1)',
        borderRadius: 4,
      }}
    >
      {value !== 1 && <div style={{ ...dotStyle, ...top, ...left }} />}
      {value > 3 && <div style={{ ...dotStyle, ...top, ...right }} />}
      {value === 6 && <div style={{ ...dotStyle, ...mid, ...left }} />}
      {value % 2 === 1 && <div style={{ ...dotStyle, ...mid, ...center }} />}
      {value === 6 && <div style={{ ...dotStyle, ...mid, ...right }} />}
      {value > 3 && <div style={{ ...dotStyle, ...bottom, ...left }} />}
      {value !== 1 && <div style={{ ...dotStyle, ...bottom, ...right }} />}
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
    <div style={{ display: 'flex', flexDirection: 'column', width }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: 140,
        }}
      >
        <div
          style={{
            width: width * 0.78,
            height,
            backgroundColor: 'var(--accent)',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: Math.min(420 / (1.5 * props.nbValues), 12),
          fontFamily: 'var(--font-mono)',
          color: 'var(--fg3)',
          marginTop: 4,
        }}
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        height: '100%',
        minHeight: 360,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {rolls.map((value, index) => (
          <Die key={`die-${index}-${value}`} value={value} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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

import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { useSimulationCanvas } from 'automatick/react/canvas';
import {
  DemoControlPanel,
  DemoControlGroup,
} from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import { CanvasStage } from '../components/CanvasStage';
import settlementSim, { GRID } from '../sims/settlementSim';
import styles from './SettlementDemo.module.css';

const CSS_SIZE = 600;

const SETTLEMENT_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#34495e',
];

function SettlementCanvas() {
  const canvasRef = useSimulationCanvas<typeof settlementSim>(
    (ctx, { data }, view) => {
      const scale = CSS_SIZE / GRID;

      view.blitGrid(GRID, GRID, (px) => {
        for (let i = 0; i < GRID * GRID; i++) {
          const r = data.resourceGrid[i];
          const cap = data.capacityGrid[i];
          const fill = cap > 0 ? r / cap : 0;
          const richness = cap > 0 ? Math.min(cap, 1) : 0;
          const j = i * 4;
          px[j] = Math.floor(18 + (1 - fill) * richness * 40);
          px[j + 1] = Math.floor(18 + fill * richness * 140);
          px[j + 2] = Math.floor(12 + fill * richness * 20);
          px[j + 3] = 255;
        }
      });

      for (const agent of data.agents) {
        if (agent.home >= 0) {
          const color = SETTLEMENT_COLORS[agent.home % SETTLEMENT_COLORS.length];
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(agent.x * scale - 1.5, agent.y * scale - 1.5, 3, 3);
        } else {
          ctx.fillStyle = '#e0d6c0';
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(agent.x * scale, agent.y * scale, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      for (let si = 0; si < data.settlements.length; si++) {
        const s = data.settlements[si];
        const color = SETTLEMENT_COLORS[si % SETTLEMENT_COLORS.length];

        const cols = Math.ceil(Math.sqrt(s.buildings));
        const bldgSize = Math.max(2, 4 - cols * 0.2);
        const startX = s.x * scale - (cols * (bldgSize + 1)) / 2;
        const startY = s.y * scale - (cols * (bldgSize + 1)) / 2;
        ctx.fillStyle = color;
        for (let b = 0; b < s.buildings && b < 40; b++) {
          const bx = startX + (b % cols) * (bldgSize + 1);
          const by = startY + Math.floor(b / cols) * (bldgSize + 1);
          ctx.fillRect(bx, by, bldgSize, bldgSize);
        }

        ctx.lineWidth = 1.5;
        for (let sj = si + 1; sj < data.settlements.length; sj++) {
          const other = data.settlements[sj];
          const dist = Math.sqrt((s.x - other.x) ** 2 + (s.y - other.y) ** 2);
          if (dist < 60) {
            ctx.strokeStyle = '#d4a843';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(s.x * scale, s.y * scale);
            ctx.lineTo(other.x * scale, other.y * scale);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
    },
    { width: CSS_SIZE, height: CSS_SIZE }
  );

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

function SettlementStats() {
  const { data } = useSimulation<typeof settlementSim>();
  const totalPop = data.settlements.reduce((s, c) => s + c.population, 0);
  const totalBuildings = data.settlements.reduce((s, c) => s + c.buildings, 0);
  const vagabonds = data.agents.filter((a) => a.home < 0).length;
  return (
    <div className='group'>
      <div className='g-lbl'>Status</div>
      <div className={styles.stats}>
        <div className={styles.row}>
          <span className={styles.label}>settlements</span>
          <span className={styles.value}>{data.settlements.length}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>settled pop.</span>
          <span className={styles.value}>{totalPop}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>vagabonds</span>
          <span className={styles.value}>{vagabonds}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>buildings</span>
          <span className={styles.value}>{totalBuildings}</span>
        </div>
      </div>
    </div>
  );
}

const SETTLEMENT_GROUPS: DemoControlGroup[] = [
  {
    label: 'World (resets)',
    controls: [
      {
        type: 'range',
        param: 'numAgents',
        label: 'Agents',
        min: 20,
        max: 150,
        step: 10,
      },
      {
        type: 'range',
        param: 'resourceGrowback',
        label: 'Resource growth',
        min: 0.005,
        max: 0.1,
        step: 0.005,
      },
    ],
  },
  {
    label: 'Settlements',
    controls: [
      {
        type: 'range',
        param: 'settlementThreshold',
        label: 'Found threshold',
        min: 10,
        max: 80,
        step: 5,
      },
      {
        type: 'range',
        param: 'buildCost',
        label: 'Build cost',
        min: 5,
        max: 50,
        step: 5,
      },
    ],
  },
];

export function SettlementDemo() {
  return (
    <Simulation sim={settlementSim} pauseWhenHidden delayMs={30} autoplay>
      <DemoSplit
        preview={<SettlementCanvas />}
        controls={
          <DemoControlPanel
            groups={SETTLEMENT_GROUPS}
            extra={<SettlementStats />}
            showStep
          />
        }
      />
    </Simulation>
  );
}

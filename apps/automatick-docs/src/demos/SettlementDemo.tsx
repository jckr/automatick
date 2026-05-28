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
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const offscreenRef = React.useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = React.useRef<ImageData | null>(null);

  const canvasRef = useSimulationCanvas<typeof settlementSim>((ctx, { data }) => {
    const scale = CSS_SIZE / GRID;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = GRID;
      off.height = GRID;
      offscreenRef.current = off;
    }
    const off = offscreenRef.current;
    const offCtx = off.getContext('2d');
    if (!offCtx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }

    if (!imageDataRef.current) {
      imageDataRef.current = offCtx.createImageData(GRID, GRID);
    }
    const imageData = imageDataRef.current;
    const px = imageData.data;

    for (let i = 0; i < GRID * GRID; i++) {
      const r = data.resourceGrid[i];
      const cap = data.capacityGrid[i];
      const fill = cap > 0 ? r / cap : 0;
      const j = i * 4;
      px[j] = Math.floor(20 + fill * 15);
      px[j + 1] = Math.floor(30 + fill * 80 + cap * 40);
      px[j + 2] = Math.floor(15 + fill * 10);
      px[j + 3] = 255;
    }
    offCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, CSS_SIZE, CSS_SIZE);

    for (const agent of data.agents) {
      if (agent.home >= 0) {
        const color = SETTLEMENT_COLORS[agent.home % SETTLEMENT_COLORS.length];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
      } else {
        ctx.fillStyle = '#ccc';
        ctx.globalAlpha = 0.8;
      }
      ctx.fillRect(agent.x * scale - 1, agent.y * scale - 1, 3, 3);
    }
    ctx.globalAlpha = 1;

    for (let si = 0; si < data.settlements.length; si++) {
      const s = data.settlements[si];
      const color = SETTLEMENT_COLORS[si % SETTLEMENT_COLORS.length];
      const size = 4 + Math.min(s.buildings, 20) * 1.5;

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(s.x * scale, s.y * scale, size + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  return (
    <CanvasStage maxWidth={CSS_SIZE}>
      <canvas
        ref={canvasRef}
        width={CSS_SIZE * dpr}
        height={CSS_SIZE * dpr}
        className={styles.canvas}
      />
    </CanvasStage>
  );
}

function SettlementStats() {
  const { data } = useSimulation<typeof settlementSim>();
  const totalPop = data.settlements.reduce((s, c) => s + c.population, 0);
  const totalBuildings = data.settlements.reduce((s, c) => s + c.buildings, 0);
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
    <Simulation sim={settlementSim} delayMs={30} autoplay>
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

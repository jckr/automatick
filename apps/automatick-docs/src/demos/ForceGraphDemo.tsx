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
import forceGraphSim, {
  FG_WIDTH,
  FG_HEIGHT,
  type ForceGraphParams,
} from '../sims/forceGraphSim';
import styles from './ForceGraphDemo.module.css';

const GROUP_COLORS = ['#D7451E', '#2B6E8F', '#3D6B4B', '#C98A1A', '#7A4FA0'];

function ForceGraphCanvas() {
  const canvasRef = useSimulationCanvas<typeof forceGraphSim>(
    (ctx, { data }, view) => {
      view.clear();

      const { nodes, edges } = data;

      // Edges first, behind nodes.
      ctx.lineWidth = 0.8;
      for (const e of edges) {
        const a = nodes[e.source];
        const b = nodes[e.target];
        if (!a || !b) continue;
        const sameGroup = a.group === b.group;
        ctx.strokeStyle = sameGroup
          ? 'rgba(120,120,120,0.45)'
          : 'rgba(120,120,120,0.15)';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Nodes, sized by degree and colored by group.
      for (const node of nodes) {
        const r = 3 + Math.sqrt(node.degree) * 1.6;
        ctx.fillStyle = GROUP_COLORS[node.group % GROUP_COLORS.length];
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.stroke();
      }
    },
    { width: FG_WIDTH, height: FG_HEIGHT },
  );

  return (
    <CanvasStage maxWidth={FG_WIDTH}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </CanvasStage>
  );
}

function GraphStats() {
  const { data } = useSimulation<typeof forceGraphSim>();
  const nodeCount = data?.nodes.length ?? 0;
  const edgeCount = data?.edges.length ?? 0;
  const energy = data?.totalEnergy ?? 0;
  return (
    <div className='group'>
      <div className='g-lbl'>Layout</div>
      <div className='ctrl' style={{ gridTemplateColumns: '1fr auto' }}>
        <label>Nodes / edges</label>
        <span className='val'>
          {nodeCount} / {edgeCount}
        </span>
      </div>
      <div className='ctrl' style={{ gridTemplateColumns: '1fr auto' }}>
        <label>Energy</label>
        <span className='val'>
          {Number.isFinite(energy) ? energy.toFixed(1) : '—'}
        </span>
      </div>
    </div>
  );
}

// Params that change graph topology require a reset to rebuild.
function ResetOnTopologyChange({ children }: { children: React.ReactNode }) {
  const { params, resetWith } = useSimulation<typeof forceGraphSim>();
  const lastRef = React.useRef<string>('');
  const key = `${params.preset}|${params.numNodes}|${params.edgeProbability}`;
  React.useEffect(() => {
    if (lastRef.current && lastRef.current !== key) {
      resetWith();
    }
    lastRef.current = key;
  }, [key, resetWith]);
  return <>{children}</>;
}

const FORCE_GRAPH_GROUPS: DemoControlGroup[] = [
  {
    label: 'Graph (resets)',
    controls: [
      {
        type: 'chips',
        param: 'preset',
        label: 'Preset',
        options: [
          { value: 'clusters', label: 'Clusters' },
          { value: 'random', label: 'Random' },
          { value: 'tree', label: 'Tree' },
        ],
      },
      {
        type: 'range',
        param: 'numNodes',
        label: 'Nodes',
        min: 10,
        max: 200,
        step: 10,
      },
      {
        type: 'range',
        param: 'edgeProbability',
        label: 'Edge density',
        min: 0.01,
        max: 0.2,
        step: 0.01,
      },
    ],
  },
  {
    label: 'Forces',
    controls: [
      {
        type: 'range',
        param: 'repulsionStrength',
        label: 'Repulsion',
        min: 500,
        max: 10000,
        step: 100,
      },
      {
        type: 'range',
        param: 'attractionStrength',
        label: 'Spring strength',
        min: 0.005,
        max: 0.1,
        step: 0.005,
      },
      {
        type: 'range',
        param: 'idealEdgeLength',
        label: 'Edge length',
        min: 20,
        max: 150,
        step: 5,
      },
      {
        type: 'range',
        param: 'damping',
        label: 'Damping',
        min: 0.8,
        max: 0.98,
        step: 0.01,
      },
    ],
  },
];

export function ForceGraphDemo() {
  return (
    <Simulation
      sim={forceGraphSim}
      delayMs={0}
      autoplay
      params={{ preset: 'clusters' } as Partial<ForceGraphParams>}
    >
      <ResetOnTopologyChange>
        <DemoSplit
          preview={<ForceGraphCanvas />}
          controls={
            <DemoControlPanel
              groups={FORCE_GRAPH_GROUPS}
              extra={<GraphStats />}
            />
          }
        />
      </ResetOnTopologyChange>
    </Simulation>
  );
}

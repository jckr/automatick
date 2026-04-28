import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

type Item = { to: string; label: string; badge?: 'new' };
type Group = { label: string; items: Item[]; collapsible?: boolean };

const GUIDE: Item[] = [
  { to: '/guide/getting-started', label: 'Getting started' },
  { to: '/guide/tutorial', label: 'Tutorial' },
  { to: '/guide/defining-a-sim', label: 'Defining a simulation' },
  { to: '/guide/simulation-component', label: 'Simulation component' },
  { to: '/guide/using-the-hook', label: 'Using the hook' },
  { to: '/guide/controls', label: 'Controls' },
  { to: '/guide/canvas-rendering', label: 'Canvas rendering' },
  { to: '/guide/visualization-patterns', label: 'Visualization patterns', badge: 'new' },
];

const API: Item[] = [
  { to: '/api/define-sim', label: 'defineSim' },
  { to: '/api/simulation', label: '<Simulation>' },
  { to: '/api/use-simulation', label: 'useSimulation' },
  { to: '/api/controls', label: 'Controls' },
  { to: '/api/create-engine', label: 'createEngine' },
];

const SIMPLE: Item[] = [
  { to: '/examples/counter', label: 'Counter' },
  { to: '/examples/fibonacci', label: 'Fibonacci' },
  { to: '/examples/fibonacci-spiral', label: 'Fibonacci spiral' },
  { to: '/examples/dice', label: 'Dice' },
  { to: '/examples/simple-model', label: 'Simple model' },
];

const GRID: Item[] = [
  { to: '/examples/game-of-life', label: 'Game of Life' },
  { to: '/examples/automata-1d', label: '1D automata' },
  { to: '/examples/percolation', label: 'Percolation' },
  { to: '/examples/activators', label: 'Activators' },
  { to: '/examples/langton-ant', label: "Langton's ant" },
  { to: '/examples/segregation', label: 'Segregation' },
  { to: '/examples/segregation-local', label: 'Segregation (local)' },
];

const CANVAS: Item[] = [
  { to: '/examples/gravity', label: 'N-body gravity' },
  { to: '/examples/boids', label: 'Boids' },
  { to: '/examples/snake', label: 'Snake' },
  { to: '/examples/mazes', label: 'Mazes' },
  { to: '/examples/epidemic', label: 'Epidemic' },
  { to: '/examples/chaos-game', label: 'Chaos game' },
  { to: '/examples/worker-canvas', label: 'XOR ring' },
];

const VIZ: Item[] = [
  { to: '/examples/automatick-hero', label: 'automatick — letter form', badge: 'new' },
  { to: '/examples/automatick-bubbles', label: 'automatick — bubbles', badge: 'new' },
  { to: '/examples/world-spinner', label: 'World spinner', badge: 'new' },
];

const STRESS: Item[] = [
  { to: '/examples/gray-scott', label: 'Gray-Scott' },
  { to: '/examples/stable-fluids', label: 'Stable fluids' },
  { to: '/examples/sandpile', label: 'Abelian sandpile' },
  { to: '/examples/sph-fluid', label: 'SPH fluid' },
  { to: '/examples/ising', label: 'Ising model' },
  { to: '/examples/ant-colony', label: 'Ant colony' },
  { to: '/examples/traffic', label: 'Traffic' },
];

const GROUPS: Group[] = [
  { label: 'Guide', items: GUIDE },
  { label: 'API reference', items: API },
  { label: 'Simple', items: SIMPLE, collapsible: true },
  { label: 'Grid simulations', items: GRID, collapsible: true },
  { label: 'Canvas simulations', items: CANVAS, collapsible: true },
  { label: 'Visualization', items: VIZ, collapsible: true },
  { label: 'Stress tests', items: STRESS, collapsible: true },
];

function NavItem({ to, label, badge }: Item) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-item${isActive ? ' active' : ''}`
      }
    >
      <span>{label}</span>
      {badge ? <span className={`badge ${badge}`}>{badge}</span> : null}
    </NavLink>
  );
}

function CollapsibleGroup({ group }: { group: Group }) {
  const { pathname } = useLocation();
  const containsActive = group.items.some((it) => pathname === it.to);
  const [open, setOpen] = React.useState(containsActive);

  React.useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <div className='group'>
      <button
        type='button'
        className={`group-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className='chev'>{'▶'}</span>
        {group.label}
      </button>
      {open && group.items.map((it) => <NavItem key={it.to} {...it} />)}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className='sidebar'>
      {GROUPS.map((g) =>
        g.collapsible ? (
          <CollapsibleGroup key={g.label} group={g} />
        ) : (
          <div key={g.label} className='group'>
            <div className='group-lbl'>{g.label}</div>
            {g.items.map((it) => (
              <NavItem key={it.to} {...it} />
            ))}
          </div>
        )
      )}
    </aside>
  );
}

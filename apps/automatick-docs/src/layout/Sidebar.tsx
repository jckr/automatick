import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

type Item = { to: string; label: string; badge?: 'new' };
type Group = { label: string; items: Item[]; collapsible?: boolean };

const GETTING_STARTED: Item[] = [
  { to: '/guide/getting-started', label: 'Getting started' },
  { to: '/guide/without-react', label: 'Without React' },
  { to: '/guide/with-react', label: 'With React' },
  { to: '/guide/with-canvas', label: 'With Canvas' },
  { to: '/guide/with-worker', label: 'With Worker' },
];

const GUIDE: Item[] = [
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

const EXAMPLES: Item[] = [
  { to: '/examples/dice', label: 'Dice' },
  { to: '/examples/game-of-life', label: 'Game of Life' },
  { to: '/examples/automata-1d', label: '1D automata' },
  { to: '/examples/percolation', label: 'Percolation' },
  { to: '/examples/activators', label: 'Activators' },
  { to: '/examples/langton-ant', label: "Langton's ant" },
  { to: '/examples/segregation', label: 'Segregation' },
  { to: '/examples/gravity', label: 'N-body gravity' },
  { to: '/examples/boids', label: 'Boids' },
  { to: '/examples/predator-prey', label: 'Predator–Prey' },
  { to: '/examples/crowd-compare', label: 'Crowd: selfish vs coordinated' },
  { to: '/examples/snake', label: 'Snake' },
  { to: '/examples/mazes', label: 'Mazes' },
  { to: '/examples/chaos-game', label: 'Chaos game' },
  { to: '/examples/worker-canvas', label: 'XOR ring' },
  { to: '/examples/gray-scott', label: 'Gray-Scott' },
  { to: '/examples/stable-fluids', label: 'Stable fluids' },
  { to: '/examples/sandpile', label: 'Abelian sandpile' },
  { to: '/examples/sph-fluid', label: 'SPH fluid' },
  { to: '/examples/ising', label: 'Ising model' },
  { to: '/examples/ant-colony', label: 'Ant colony' },
  { to: '/examples/traffic', label: 'Traffic' },
  { to: '/examples/falling-sand', label: 'Falling sand' },
  { to: '/examples/settlement', label: 'Settlement growth' },
  { to: '/examples/erosion', label: 'Hydraulic erosion' },
  { to: '/examples/electric-field', label: 'Electric field' },
];

const GROUPS: Group[] = [
  { label: 'Getting started', items: GETTING_STARTED },
  { label: 'Guide', items: GUIDE },
  { label: 'API reference', items: API },
  { label: 'Examples', items: EXAMPLES, collapsible: true },
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

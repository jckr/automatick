import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { EXAMPLES as EXAMPLE_MANIFEST, examplePath } from '../examples';

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

// Examples are sourced from the shared manifest (src/examples.ts) so the
// sidebar and the examples gallery never drift.
const EXAMPLES: Item[] = EXAMPLE_MANIFEST.map((ex) => ({
  to: examplePath(ex),
  label: ex.label,
  ...(ex.badge ? { badge: ex.badge } : {}),
}));

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

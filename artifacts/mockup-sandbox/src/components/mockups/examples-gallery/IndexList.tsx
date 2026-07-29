import React from 'react';
import './_group.css';
import './_indexlist.css';

// Extracted from apps/automatick-docs: ExamplesGalleryPage + ExampleVignette.
// Data mirrors src/examples.ts (slug + label); router Link stubbed as <a>.
const EXAMPLES: { slug: string; label: string; objectPosition?: string }[] = [
  { slug: 'dice', label: 'Dice' },
  { slug: 'game-of-life', label: 'Game of Life' },
  { slug: 'automata-1d', label: '1D automata' },
  { slug: 'percolation', label: 'Percolation' },
  { slug: 'activators', label: 'Activators' },
  { slug: 'langton-ant', label: "Langton's ant" },
  { slug: 'segregation', label: 'Segregation' },
  { slug: 'gravity', label: 'N-body gravity' },
  { slug: 'boids', label: 'Boids' },
  { slug: 'predator-prey', label: 'Predator–Prey' },
  { slug: 'crowd-compare', label: 'Crowd: selfish vs coordinated' },
  { slug: 'snake', label: 'Snake' },
  { slug: 'mazes', label: 'Mazes' },
  { slug: 'chaos-game', label: 'Chaos game' },
  { slug: 'worker-canvas', label: 'XOR ring' },
  { slug: 'gray-scott', label: 'Gray-Scott' },
  { slug: 'stable-fluids', label: 'Stable fluids' },
  { slug: 'sandpile', label: 'Abelian sandpile' },
  { slug: 'sph-fluid', label: 'SPH fluid' },
  { slug: 'ising', label: 'Ising model' },
  { slug: 'ant-colony', label: 'Ant colony' },
  { slug: 'traffic', label: 'Traffic' },
  { slug: 'falling-sand', label: 'Falling sand' },
  { slug: 'settlement', label: 'Settlement growth' },
  { slug: 'erosion', label: 'Hydraulic erosion' },
  { slug: 'electric-field', label: 'Electric field' },
  { slug: 'material-ca', label: 'Water, fire & smoke' },
  { slug: 'wave', label: 'Wave propagation' },
  { slug: 'physarum', label: 'Slime mold' },
  { slug: 'sugarscape', label: 'Sugarscape' },
  { slug: 'opinion-dynamics', label: 'Opinion dynamics' },
  { slug: 'market', label: 'Market' },
  { slug: 'particle-life', label: 'Particle life' },
  { slug: 'fireworks', label: 'Fireworks' },
  { slug: 'spring-mass', label: 'Spring-mass' },
  { slug: 'cloth', label: 'Rope & cloth' },
  { slug: 'rigid-body', label: 'Rigid bodies' },
  { slug: 'double-pendulum', label: 'Double pendulum' },
  { slug: 'force-graph', label: 'Force-directed graph' },
  { slug: 'l-systems', label: 'L-systems' },
  { slug: 'terrain', label: 'Terrain' },
];

const thumb = (slug: string) => `/__mockup/images/thumbnails/${slug}.png`;

const TableHeader = ({ mobileHidden = false }: { mobileHidden?: boolean }) => (
  <div className={`il-table-headers ${mobileHidden ? 'il-desktop-only' : ''}`}>
    <span className="il-th-num">NO.</span>
    <span className="il-th-sys">SYSTEM</span>
    <span className="il-th-prev">PREVIEW</span>
  </div>
);

export function IndexList() {
  const half = Math.ceil(EXAMPLES.length / 2);
  const col1 = EXAMPLES.slice(0, half);
  const col2 = EXAMPLES.slice(half);

  const renderRow = (ex: typeof EXAMPLES[0], idx: number) => {
    const num = String(idx + 1).padStart(2, '0');
    return (
      <a key={ex.slug} href="#" className="il-row" onClick={(e) => e.preventDefault()}>
        <span className="il-num">{num}</span>
        <span className="il-name">{ex.label}</span>
        <div className="il-thumb-container">
          <img src={thumb(ex.slug)} alt={ex.label} className="il-thumb" loading="lazy" />
        </div>
      </a>
    );
  };

  return (
    <div className="il-root">
      <header className="il-header">
        <div>
          <h1 className="il-title">Index</h1>
        </div>
        <div className="il-meta">
          <span>
            <strong>{EXAMPLES.length}</strong> / SIMULATIONS
          </span>
        </div>
      </header>

      <div className="il-split-grid">
        <div className="il-col">
          <TableHeader />
          {col1.map((ex, i) => renderRow(ex, i))}
        </div>
        <div className="il-col">
          <TableHeader mobileHidden />
          {col2.map((ex, i) => renderRow(ex, half + i))}
        </div>
      </div>
    </div>
  );
}

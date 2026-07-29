import React from 'react';
import './_group.css';
import './_specimenwall.css';

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

const SECTIONS = [
  {
    name: 'Cellular Automata',
    slugs: [
      'dice',
      'game-of-life',
      'automata-1d',
      'percolation',
      'activators',
      'langton-ant',
      'segregation',
      'gray-scott',
      'sandpile',
      'ising',
      'material-ca',
      'wave',
    ],
  },
  {
    name: 'Agents & Ecology',
    slugs: [
      'boids',
      'predator-prey',
      'crowd-compare',
      'snake',
      'ant-colony',
      'traffic',
      'settlement',
      'physarum',
      'sugarscape',
      'opinion-dynamics',
      'market',
      'particle-life',
    ],
  },
  {
    name: 'Physics & Fluids',
    slugs: [
      'gravity',
      'stable-fluids',
      'sph-fluid',
      'falling-sand',
      'erosion',
      'electric-field',
      'spring-mass',
      'cloth',
      'rigid-body',
      'double-pendulum',
    ],
  },
  {
    name: 'Fractals & Generative',
    slugs: [
      'mazes',
      'chaos-game',
      'worker-canvas',
      'fireworks',
      'force-graph',
      'l-systems',
      'terrain',
    ],
  },
];

const FEATURES = new Set([
  'boids',
  'gray-scott',
  'physarum',
  'particle-life',
  'fireworks',
  'terrain',
]);

const thumb = (slug: string) => `/__mockup/images/thumbnails/${slug}.png`;

export function SpecimenWall() {
  return (
    <div className='ag-root'>
      <div className='ag-playground'>
        <header className='ag-header'>
          <div>
            <h1>Examples</h1>
          </div>
          <div className='ag-meta'>
            <span>
              {EXAMPLES.length} · <span className='ag-now'>specimens</span>
            </span>
          </div>
        </header>

        <div className='sw-wall-wrapper'>
          {SECTIONS.map((section) => (
            <React.Fragment key={section.name}>
              <div className='sw-section-row'>{section.name}</div>
              <div className='sw-grid'>
                {section.slugs.map((slug) => {
                  const ex = EXAMPLES.find((e) => e.slug === slug);
                  if (!ex) return null;
                  const isFeature = FEATURES.has(ex.slug);
                  return (
                    <a
                      key={ex.slug}
                      className={`sw-cell ${isFeature ? 'sw-feature' : ''}`}
                      href='#'
                      onClick={(e) => e.preventDefault()}
                    >
                      <img
                        src={thumb(ex.slug)}
                        alt={ex.label}
                        loading='lazy'
                        style={{ objectPosition: ex.objectPosition || 'center' }}
                      />
                      <div className='sw-tag'>
                        <span className='sw-tag-label'>{ex.label}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

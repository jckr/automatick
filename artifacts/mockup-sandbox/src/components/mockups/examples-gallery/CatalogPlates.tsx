import React from 'react';
import './_group.css';

const EXAMPLES = [
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

const GROUPS_DEF = [
  {
    name: 'Cellular Automata',
    slugs: ['game-of-life', 'automata-1d', 'langton-ant', 'gray-scott', 'sandpile', 'falling-sand', 'material-ca', 'worker-canvas']
  },
  {
    name: 'Agents & Ecology',
    slugs: ['boids', 'predator-prey', 'crowd-compare', 'ant-colony', 'settlement', 'physarum', 'sugarscape', 'opinion-dynamics', 'market', 'particle-life', 'segregation', 'activators']
  },
  {
    name: 'Physics & Fluids',
    slugs: ['gravity', 'stable-fluids', 'sph-fluid', 'ising', 'traffic', 'erosion', 'electric-field', 'wave', 'fireworks', 'spring-mass', 'cloth', 'rigid-body', 'double-pendulum', 'force-graph', 'percolation']
  },
  {
    name: 'Fractals & Generative',
    slugs: ['dice', 'mazes', 'chaos-game', 'l-systems', 'terrain', 'snake']
  }
];

export function CatalogPlates() {
  const groups = GROUPS_DEF.map(def => ({
    name: def.name,
    examples: def.slugs.map(slug => EXAMPLES.find(e => e.slug === slug)!).filter(Boolean)
  }));

  return (
    <div className="bg-[var(--bg1)] text-[var(--fg2)] font-sans min-h-screen selection:bg-[var(--accent)] selection:text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-12 md:py-24">
        
        {/* Page Header */}
        <header className="mb-32 flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[var(--ink)] pb-8 gap-8">
          <div>
            <h1 className="text-[var(--ink)] text-6xl sm:text-7xl md:text-[8rem] leading-[0.85] font-bold tracking-tighter mb-6">
              CATALOGUE
            </h1>
            <p className="font-mono text-[var(--fg3)] uppercase tracking-[0.2em] text-sm md:text-base">
              Simulations & Models / Index Vol. 1
            </p>
          </div>
          <div className="font-mono text-[var(--ink)] uppercase tracking-[0.1em] text-sm md:text-base md:text-right leading-relaxed">
            <div>{EXAMPLES.length} PLATES</div>
            <div className="text-[var(--accent)] mt-1">ONLINE EDITION</div>
          </div>
        </header>

        {/* The Groups */}
        <div className="flex flex-col gap-32 md:gap-48">
          {groups.map((group, gIdx) => (
            <section key={group.name} className="relative">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-[var(--border)] pt-8">
                
                {/* Section Header */}
                <div className="md:col-span-4 lg:col-span-3">
                  <div className="sticky top-12 font-mono text-[var(--ink)] text-xl md:text-2xl uppercase tracking-widest leading-snug">
                    <span className="block text-[var(--fg3)] mb-4 text-sm md:text-base">
                      SECTION {(gIdx + 1).toString().padStart(2, '0')}
                    </span>
                    {group.name}
                    <div className="mt-8 h-[1px] w-12 bg-[var(--ink)] hidden md:block" />
                  </div>
                </div>

                {/* The Plates Grid */}
                <div className="md:col-span-8 lg:col-span-9">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-24">
                    {group.examples.map((ex, exIdx) => (
                      <a 
                        key={ex.slug} 
                        href="#" 
                        onClick={(e) => e.preventDefault()} 
                        className="group block no-underline cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg1)]"
                      >
                        <figure className="m-0 p-0">
                          {/* Plate Meta */}
                          <div className="mb-4 flex flex-wrap items-end justify-between border-b border-[var(--border)] pb-3 font-mono text-xs md:text-sm tracking-widest uppercase transition-colors group-hover:border-[var(--accent)] gap-4">
                            <span className="text-[var(--fg3)] group-hover:text-[var(--accent)] transition-colors whitespace-nowrap">
                              FIG. {(exIdx + 1).toString().padStart(2, '0')}
                            </span>
                            <span className="text-[var(--ink)] font-medium group-hover:text-[var(--accent)] transition-colors text-right">
                              {ex.label}
                            </span>
                          </div>
                          
                          {/* Plate Image */}
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--bg2)] border border-[var(--border)] group-hover:border-[var(--accent)] transition-colors">
                            <img 
                              src={thumb(ex.slug)} 
                              alt={ex.label} 
                              className="h-full w-full object-cover grayscale opacity-90 transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:opacity-100" 
                              loading="lazy" 
                            />
                            {/* Blue overlay tint on hover */}
                            <div className="absolute inset-0 bg-[var(--accent)] mix-blend-color opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 pointer-events-none" />
                          </div>
                        </figure>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-48 border-t-2 border-[var(--ink)] pt-8 pb-24 font-mono text-sm tracking-widest uppercase text-[var(--ink)]">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <span>AUTOMATICK © {new Date().getFullYear()}</span>
            <span className="text-[var(--fg3)]">END OF VOL. 1</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

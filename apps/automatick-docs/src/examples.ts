/**
 * Single source of truth for the curated examples shown in both the sidebar
 * TOC and the (forthcoming) examples gallery. Keep this list in sync with the
 * routes registered in App.tsx.
 *
 * Capture metadata (`warmupMs`, `focus`, `captureSelector`) drives the offline
 * thumbnail-capture script. It is also forward-compatible with looping clips:
 * a clip records a window of frames around the same `warmupMs`, cropped to the
 * same `focus` region.
 */

/**
 * A crop region within the captured preview, expressed as fractions (0–1) of
 * the preview box — resolution-independent, so it survives viewport/dpr
 * changes and is easy to eyeball off a contact sheet. `{ x: 0.5, y: 0, width:
 * 0.5, height: 1 }` is "the right half".
 */
export type FocusRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExampleMeta = {
  /** URL-safe id; also the final segment of the route and the thumbnail filename. */
  slug: string;
  /** Display title, shown in the sidebar and gallery. */
  label: string;
  /** One-line description for gallery captions and llms.txt (issue #69). */
  blurb?: string;
  /** Optional sidebar badge. */
  badge?: 'new';
  /** Per-example capture timing: how long to let the sim run before grabbing the frame. */
  warmupMs?: number;
  /** Per-example crop to the "interesting detail" (defaults to a center-crop of the preview). */
  focus?: FocusRegion;
  /**
   * CSS `object-position` for the gallery tile's cover-crop (e.g. `'top left'`).
   * A cheap framing nudge when the full-preview thumbnail is just off-center —
   * no recapture needed. Defaults to `'center'`.
   */
  objectPosition?: string;
  /** Override the default `.pg-sim` capture selector for unusual layouts. */
  captureSelector?: string;
};

export const EXAMPLES: ExampleMeta[] = [
  // Histogram builds up roll-by-roll; let it accumulate visible bars.
  { slug: 'dice', label: 'Dice', warmupMs: 9000 },
  { slug: 'game-of-life', label: 'Game of Life' },
  // Rows are drawn top-down over time; wait for the triangle to fill the grid.
  { slug: 'automata-1d', label: '1D automata', warmupMs: 8000 },
  { slug: 'percolation', label: 'Percolation' },
  { slug: 'activators', label: 'Activators' },
  { slug: 'langton-ant', label: "Langton's ant" },
  { slug: 'segregation', label: 'Segregation' },
  { slug: 'gravity', label: 'N-body gravity' },
  { slug: 'boids', label: 'Boids' },
  { slug: 'predator-prey', label: 'Predator–Prey' },
  // Crop to the two corridors up top; the arrivals chart below starts empty.
  {
    slug: 'crowd-compare',
    label: 'Crowd: selfish vs coordinated',
    focus: { x: 0, y: 0, width: 1, height: 0.52 },
  },
  // Snake grows as it eats; give it time to become a satisfying length.
  { slug: 'snake', label: 'Snake', warmupMs: 8000 },
  { slug: 'mazes', label: 'Mazes' },
  // Points accumulate into the Sierpinski attractor; needs a long warm-up.
  { slug: 'chaos-game', label: 'Chaos game', warmupMs: 12000 },
  // Accumulated rows fill the canvas top-down; wait for the ring to develop.
  { slug: 'worker-canvas', label: 'XOR ring', warmupMs: 8000 },
  { slug: 'gray-scott', label: 'Gray-Scott' },
  { slug: 'stable-fluids', label: 'Stable fluids' },
  { slug: 'sandpile', label: 'Abelian sandpile' },
  // Fluid settles into the lower portion of the tank; crop to it.
  { slug: 'sph-fluid', label: 'SPH fluid', focus: { x: 0, y: 0.42, width: 1, height: 0.58 } },
  { slug: 'ising', label: 'Ising model' },
  { slug: 'ant-colony', label: 'Ant colony' },
  // Crop to the road band; avoids the perf overlay in the top-right corner.
  { slug: 'traffic', label: 'Traffic', focus: { x: 0, y: 0.24, width: 1, height: 0.5 } },
  { slug: 'falling-sand', label: 'Falling sand' },
  { slug: 'settlement', label: 'Settlement growth' },
  { slug: 'erosion', label: 'Hydraulic erosion' },
  { slug: 'electric-field', label: 'Electric field' },
  // The seeded ember flares into fire + a smoke plume around ~0.4s, then burns
  // out fast; grab it at the peak and crop to the blaze (above the perf HUD).
  {
    slug: 'material-ca',
    label: 'Water, fire & smoke',
    warmupMs: 450,
    focus: { x: 0.22, y: 0.42, width: 0.6, height: 0.26 },
  },
  { slug: 'wave', label: 'Wave propagation' },
  { slug: 'physarum', label: 'Slime mold' },
  { slug: 'sugarscape', label: 'Sugarscape' },
  // Opinions start scattered and pale; let them cluster into clear camps.
  { slug: 'opinion-dynamics', label: 'Opinion dynamics', warmupMs: 9000 },
  { slug: 'market', label: 'Market' },
  { slug: 'particle-life', label: 'Particle life' },
  { slug: 'fireworks', label: 'Fireworks' },
  { slug: 'spring-mass', label: 'Spring-mass' },
  { slug: 'cloth', label: 'Rope & cloth' },
  // Bodies fall and settle into a pile at the bottom; wait, then crop to it.
  {
    slug: 'rigid-body',
    label: 'Rigid bodies',
    warmupMs: 5000,
    focus: { x: 0, y: 0.42, width: 1, height: 0.58 },
  },
  { slug: 'double-pendulum', label: 'Double pendulum' },
  { slug: 'force-graph', label: 'Force-directed graph' },
  { slug: 'l-systems', label: 'L-systems' },
  { slug: 'terrain', label: 'Terrain' },
];

/**
 * Thematic grouping for the examples gallery ("Specimen Wall"). Order here is
 * the display order of both the header legend and the wall itself. When adding
 * a new example to EXAMPLES, add its slug to a category below — the gallery
 * renders any uncategorized examples at the end so nothing is silently
 * dropped, but they'll lack a section.
 */
export const EXAMPLE_CATEGORIES: { name: string; slugs: string[] }[] = [
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
    slugs: ['mazes', 'chaos-game', 'worker-canvas', 'fireworks', 'force-graph', 'l-systems', 'terrain'],
  },
];

/** The route path for an example (e.g. `/examples/boids`). */
export function examplePath(ex: ExampleMeta): string {
  return `/examples/${ex.slug}`;
}

/**
 * The thumbnail URL for an example, honoring the Vite base path so it resolves
 * correctly under GitHub Pages (`/automatick/`). Thumbnails are committed under
 * `public/thumbnails/<slug>.png`.
 */
export function thumbnailUrl(ex: ExampleMeta): string {
  return `${import.meta.env.BASE_URL}thumbnails/${ex.slug}.png`;
}

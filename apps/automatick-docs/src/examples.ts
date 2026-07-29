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
  // Zoom to the highway-building blob; full frame is mostly empty white.
  {
    slug: 'langton-ant',
    label: "Langton's ant",
    warmupMs: 6000,
    focus: { x: 0.28, y: 0.28, width: 0.48, height: 0.48 },
  },
  { slug: 'segregation', label: 'Segregation' },
  // Bodies are tiny at full frame; let orbits develop, then zoom to the core.
  {
    slug: 'gravity',
    label: 'N-body gravity',
    warmupMs: 6000,
    focus: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
  },
  // Feature tile: let flocks form, then zoom in so the birds read at tile size.
  {
    slug: 'boids',
    label: 'Boids',
    warmupMs: 12000,
    focus: { x: 0.3, y: 0.28, width: 0.42, height: 0.42 },
  },
  { slug: 'predator-prey', label: 'Predator–Prey' },
  // Crop to the two corridors up top; the arrivals chart below starts empty.
  {
    slug: 'crowd-compare',
    label: 'Crowd: selfish vs coordinated',
    focus: { x: 0.03, y: 0.21, width: 0.88, height: 0.27 },
  },
  // Snake grows as it eats; give it time to become a satisfying length.
  // Snake lives in the lower half of the stage; crop to it.
  {
    slug: 'snake',
    label: 'Snake',
    warmupMs: 8000,
    focus: { x: 0.05, y: 0.42, width: 0.9, height: 0.55 },
  },
  // Zoom so the thin corridors are legible at tile size.
  { slug: 'mazes', label: 'Mazes', focus: { x: 0.08, y: 0.08, width: 0.55, height: 0.55 } },
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
  // Ripples are strongest right after the drop; shoot early and zoom in.
  {
    slug: 'wave',
    label: 'Wave propagation',
    warmupMs: 1400,
    focus: { x: 0.22, y: 0.22, width: 0.56, height: 0.56 },
  },
  { slug: 'physarum', label: 'Slime mold' },
  { slug: 'sugarscape', label: 'Sugarscape' },
  // Opinions start scattered and pale; let them cluster into clear camps.
  // Diverging scale fades to near-white at consensus — shoot EARLY, while
  // opinions are still polarized into vivid blue/red camps.
  {
    slug: 'opinion-dynamics',
    label: 'Opinion dynamics',
    warmupMs: 300,
    focus: { x: 0.15, y: 0.12, width: 0.55, height: 0.55 },
  },
  // Crop to the price chart itself; full frame is mostly whitespace.
  { slug: 'market', label: 'Market', warmupMs: 6000, focus: { x: 0.04, y: 0.07, width: 0.82, height: 0.5 } },
  { slug: 'particle-life', label: 'Particle life' },
  // Time the shot to catch a full burst rather than the gap between launches.
  { slug: 'fireworks', label: 'Fireworks', warmupMs: 3200, focus: { x: 0.15, y: 0.05, width: 0.7, height: 0.7 } },
  // Crop to the lattice; full frame leaves it small and off-center.
  { slug: 'spring-mass', label: 'Spring-mass', warmupMs: 4000, focus: { x: 0.42, y: 0.02, width: 0.36, height: 0.58 } },
  // Crop to the hanging cloth; give it time to swing into a nice drape.
  { slug: 'cloth', label: 'Rope & cloth', warmupMs: 4000, focus: { x: 0.45, y: 0, width: 0.55, height: 0.62 } },
  // Bodies fall and settle into a pile at the bottom; wait, then crop to it.
  {
    slug: 'rigid-body',
    label: 'Rigid bodies',
    warmupMs: 5000,
    focus: { x: 0, y: 0.42, width: 1, height: 0.58 },
  },
  // Let the trace accumulate into a dense ribbon, then zoom to it.
  {
    slug: 'double-pendulum',
    label: 'Double pendulum',
    warmupMs: 16000,
    focus: { x: 0.24, y: 0.18, width: 0.52, height: 0.52 },
  },
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

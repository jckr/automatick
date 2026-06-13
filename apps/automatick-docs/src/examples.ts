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

/** A crop region within the captured preview, in CSS pixels of the preview box. */
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

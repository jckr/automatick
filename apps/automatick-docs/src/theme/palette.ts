/**
 * Central color palette for all demo/sim canvas rendering.
 *
 * ROLE
 * ----
 * This file is the single home for every color *literal* used by the
 * TypeScript/TSX demo and simulation renderers in this app (canvas fills,
 * strokes, chart series, RGB blit math, theme fallbacks, etc.). Canvas code
 * paints to a raw 2D context and cannot read CSS custom properties directly,
 * so those colors live here as plain string/number literals instead of in
 * `src/styles/tokens.css`.
 *
 * RULE
 * ----
 * No color literals in demo/sim TS/TSX files. Import the value you need from
 * here instead. If you need a new color, add it here (shared if reused across
 * demos, otherwise in that demo's per-sim palette object) and import it.
 *
 * SYNC
 * ----
 * The SHARED constants below mirror semantic tokens in
 * `src/styles/tokens.css`. When a token's value changes there, update the
 * matching constant here (and vice versa) so canvas fallbacks stay visually
 * identical to the CSS-driven UI. These are the *fallback* values passed to
 * `view.theme('--token', fallback)`; the live theme value wins at runtime, so
 * they only show if the custom property is missing.
 *
 * COMPUTED COLORS (guidance for consumers)
 * ----------------------------------------
 * Some renderers build `hsl()` / `rgb()` strings from live simulation data
 * (speed, strain, hue, depth…). Those cannot be reduced to a single literal.
 * For each such case this file exports the *fixed* parts — hue endpoints,
 * saturation/lightness constants, RGB channel anchors, or base tuples — and
 * the consumer keeps the interpolation math, substituting the exported
 * constants for the previously-inlined magic numbers. Each computed-color
 * palette below documents its substitution pattern in a comment.
 */

/* ============================================================================
 * SHARED — reused across multiple demos/sims.
 * Names and values mirror src/styles/tokens.css semantic tokens.
 * Keep in sync with src/styles/tokens.css.
 * ========================================================================== */

/** `--accent` / `--viz-1` — signature electric blue. */
export const ACCENT = '#0055ff';

/** `--fg1` — primary ink (deep near-black). */
export const INK = '#0a0a0a';

/** `--bg1` / paper — pure white primary light canvas. */
export const PAPER = '#ffffff';

/**
 * Theme-fallback literals passed to `view.theme('--token', fallback)`.
 * These match the tokens.css semantic values for the relevant mode; the live
 * theme value overrides them at runtime. Grouped so consumers import one
 * object instead of scattering hex literals through fallback arguments.
 *
 * Keep in sync with src/styles/tokens.css.
 */
export const themeFallback = {
  /* Light-mode surfaces / ink (tokens.css :root) */
  bg1Light: '#ffffff', // --bg1 (paper)
  bg2Light: '#f2f2f2', // --bg2 (paper-2)
  bg3Light: '#e5e5e5', // --bg3 (paper-3)
  fg1Light: '#0a0a0a', // --fg1 (ink)

  /* Dark-mode surfaces / ink used by physics/particle demos */
  bg2Dark: '#12161c', // --bg2 (dark)
  bg3Dark: '#14181f', // --bg3 (dark)
  fg1Dark: '#e6e6e6', // --fg1 (dark)

  /* Foreground scale */
  fg3: '#5b6070', // --fg3 (muted)

  /* Accent */
  accent: '#0055ff', // --accent

  /* Dataviz slots (canvas fallbacks; hues chosen to match legacy intent) */
  viz1: '#0055ff', // --viz-1 electric blue
  viz2: '#2B6E8F', // --viz-2 slate teal
  viz4: '#3D6B4B', // --viz-4 moss green

  /* Chart infra */
  border: '#2a2f3a', // --border (chart gridlines, dark)

  /* Status */
  info: '#2B6E8F', // --info
} as const;

/** Generic neutral / overlay literals reused by several renderers. */
export const overlay = {
  /** Faint white node/ring outline. */
  whiteSoft60: 'rgba(255,255,255,0.6)',
  /** Divider / dashed lane line on dark canvases. */
  whiteDivider: 'rgba(255,255,255,0.25)',
  /** Dark hairline outline (percolation grid failure border). */
  blackHairline: 'rgba(0,0,0,0.15)',
  /** Dark background bar (percolation grid footer). */
  blackBar: 'rgba(0,0,0,0.08)',
} as const;

/* ============================================================================
 * PER-SIM PALETTES
 * One object per demo/sim. Key names describe what the color *represents*.
 * ========================================================================== */

/* ---- ActivatorsDemo -------------------------------------------------------
 * Colors come entirely from theme fallbacks (--fg1, --bg3). Use
 * themeFallback.fg1Light / themeFallback.bg3Light for `view.theme(...)`. */

/* ---- AntColonyDemo -------------------------------------------------------- */
export const antColonyPalette = {
  /** Nest/home marker. */
  home: '#ff4d6d',
  /** Ant carrying food. */
  antCarrying: '#fff066',
  /** Ant not carrying food. */
  antEmpty: '#ffffff',
} as const;
/**
 * Pheromone/food blit channels (RGBA math in the blitGrid loop).
 * Consumer keeps the arithmetic; substitute these anchors for the magic
 * numbers. Example: `px[j] = antColonyBlit.foodR` when hasFood; else
 * `px[j] = antColonyBlit.baseR + hpv * antColonyBlit.homeRScale`.
 */
export const antColonyBlit = {
  /** Cell containing food → solid golden RGBA. */
  foodR: 255,
  foodG: 220,
  foodB: 80,
  foodA: 255,
  /** Empty cell base (dark) channels before pheromone contributions. */
  baseR: 10,
  baseG: 10,
  baseB: 20,
  /** Per-channel scaling by home pheromone (hpv) and food pheromone (f). */
  homeRScale: 80, // baseR + hpv * homeRScale
  foodGScale: 200, // baseG + f * foodGScale
  homeBScale: 200, // baseB + hpv * homeBScale + f * foodBScale
  foodBScale: 40,
  alpha: 255,
} as const;

/* ---- AutomatickBubblesDemo -----------------------------------------------
 * Outside-mask bubbles sweep an HSL hue band; inside-mask bubbles use the
 * accent color (parsed from --accent, fallback below).
 * Substitution: hueDeg = hueMinDeg + (hueMaxDeg - hueMinDeg) * b.hue, then
 * hslToRgb(hueDeg/360, saturation, lightness). */
export const bubblesPalette = {
  /** `view.theme('--bg1', fallback)` primary canvas. */
  bgFallback: '#ffffff',
  /** `view.theme('--fg1', fallback)` mask ink. */
  inkFallback: '#0a0a0a',
  /** `view.theme('--accent', fallback)` accent for inside-mask bubbles. */
  accentFallback: '#0055ff',
  /** RGB fallback tuple if the accent hex fails to parse. */
  accentRgbFallback: [215, 69, 30] as const,
  /** Outside-mask HSL band: orange (min) → cyan-blue (max), fixed S/L. */
  hueMinDeg: 30,
  hueMaxDeg: 200,
  saturation: 0.5,
  lightness: 0.42,
} as const;

/* ---- AutomatickHeroDemo --------------------------------------------------
 * All colors are theme fallbacks. */
export const heroPalette = {
  bgFallback: '#ffffff', // --bg1
  linkFallback: '#0055ff', // --accent
  nodeFallback: '#0a0a0a', // --fg1
  dotFallback: '#5b6070', // --fg3
} as const;

/* ---- BoidsDemo ------------------------------------------------------------
 * Per-force dataviz colors via theme fallbacks. */
export const boidsPalette = {
  bgFallback: '#e5e5e5', // --bg3
  inkFallback: '#0a0a0a', // --fg1
  separationFallback: '#0055ff', // --viz-1
  alignmentFallback: '#3D6B4B', // --viz-4
  cohesionFallback: '#2B6E8F', // --viz-2
} as const;

/* ---- ChaosGameDemo --------------------------------------------------------
 * background/color are generated by chaosGameSim (see chaosGameSimPalette).
 * Only the attractor marker is a literal here. */
export const chaosGameDemoPalette = {
  /** Attractor vertex markers drawn over the background. */
  attractorMarker: 'rgba(255,255,255,0.4)',
} as const;

/* ---- ClothDemo ------------------------------------------------------------
 * Tension tint is computed rgb(). Substitution:
 *   r = relaxedR + tension * rStretchDelta
 *   g = relaxedG - tension * gStretchDelta
 *   b = relaxedB - tension * bStretchDelta   (each Math.round'd) */
export const clothPalette = {
  inkFallback: '#e6e6e6', // --fg1 (dark)
  bgFallback: '#12161c', // --bg2 (dark)
  pinFallback: '#0055ff', // --viz-1
  /** Relaxed-constraint RGB anchor (tension = 0). */
  relaxedR: 120,
  relaxedG: 120,
  relaxedB: 130,
  /** Per-channel shift toward the stretched (red) end (tension = 1). */
  rStretchDelta: 135, // +
  gStretchDelta: 90, // -
  bStretchDelta: 100, // -
} as const;

/* ---- CrowdCompareDemo ----------------------------------------------------- */
export const crowdComparePalette = {
  /** Agent group colors, indexed by group id. */
  groupColors: ['#3b82f6', '#e8612c', '#22c55e', '#a855f7'] as const,
  /** Obstacle rectangles. */
  obstacleFill: '#39414f',
  /** Selfish world label / chart series. */
  selfish: '#d9534f',
  /** Coordinated world label / chart series. */
  coordinated: '#41a36a',
  /** Panel divider line. */
  divider: 'rgba(255,255,255,0.25)',
  /** Dark stage background fallback (--bg3 dark). */
  bgFallback: '#1b1f27',
} as const;

/* ---- DoublePendulumDemo --------------------------------------------------
 * Per-pendulum HSL keyed by pen.hue. Substitution keeps `pen.hue` and alpha:
 *   trail : `hsla(${hue}, ${trailSat}%, ${trailLight}%, ${alpha})`
 *   arm   : `hsla(${hue}, ${armSat}%, ${armLight}%, ${armAlpha})`
 *   bob   : `hsl(${hue}, ${bobSat}%, ${bobLight}%)` */
export const doublePendulumPalette = {
  inkFallback: '#e6e6e6', // --fg1 (dark)
  bgFallback: '#12161c', // --bg2 (dark)
  trailSat: 80,
  trailLight: 60,
  trailMaxAlpha: 0.85, // alpha = (k / trailCount) * trailMaxAlpha
  armSat: 30,
  armLight: 70,
  armAlpha: 0.85,
  bobSat: 70,
  bobLight: 55,
} as const;

/* ---- EMFieldDemo ----------------------------------------------------------
 * Diverging potential heatmap interpolates MID → POS (positive) or
 * MID → NEG (negative). Substitution per channel:
 *   px = mid[c] + (end[c] - mid[c]) * abs(tanh(potential * potVis)) */
export const emFieldPalette = {
  /** Heatmap midpoint (potential ≈ 0), dark. */
  heatMid: [16, 18, 26] as const,
  /** Positive potential end. */
  heatPos: [228, 78, 58] as const,
  /** Negative potential end. */
  heatNeg: [62, 124, 232] as const,
  /** Flat backdrop when the potential map is hidden. */
  bg: '#10121a',
  /** Positive charge fill. */
  posFill: '#e74c3c',
  /** Negative charge fill. */
  negFill: '#3b82f6',
  /** Field-line stroke. */
  fieldLine: 'rgba(222, 228, 240, 0.34)',
  /** Charge outline ring. */
  chargeOutline: 'rgba(255, 255, 255, 0.85)',
  /** +/− glyph stroke. */
  glyph: 'rgba(255, 255, 255, 0.95)',
} as const;

/* ---- EpidemicDemo --------------------------------------------------------- */
export const epidemicPalette = {
  bgFallback: '#e5e5e5', // --bg3
  /** Agent + chart series colors keyed by SIR status. */
  status: {
    healthy: '#3D6B4B',
    sick: '#0055ff',
    recovered: '#8A8A8A',
    dead: '#0a0a0a',
  },
  /** Fallback fill for an unknown status. */
  unknown: '#999',
} as const;

/* ---- FireworksDemo -------------------------------------------------------
 * Particles are `hsla(${p.hue}, 100%, ${light}%, ${alpha})` where light
 * depends on particle type. Substitution: light = burstLight | sparkLight |
 * trailLight by p.type; alpha and hue stay from sim data. */
export const fireworksPalette = {
  /** Night-sky background (clear + trail fade target). */
  bg: '#05060f',
  saturation: 100,
  burstLight: 65,
  sparkLight: 70,
  trailLight: 50, // any other type
} as const;

/* ---- ForceGraphDemo ------------------------------------------------------- */
export const forceGraphPalette = {
  /** Node colors keyed by group index (mod length). */
  groupColors: ['#0055ff', '#2B6E8F', '#3D6B4B', '#C98A1A', '#7A4FA0'] as const,
  /** Edge within the same group. */
  edgeSameGroup: 'rgba(120,120,120,0.45)',
  /** Edge across groups. */
  edgeCrossGroup: 'rgba(120,120,120,0.15)',
  /** Node outline ring. */
  nodeOutline: 'rgba(255,255,255,0.6)',
} as const;

/* ---- GravityDemo ---------------------------------------------------------
 * Per-generation HSL swatches. Substitution keeps the two draws:
 *   glow : `hsla(${h}, ${s}%, ${l}%, ${glowAlpha})`
 *   core : `hsl(${h}, ${s}%, ${l}%)` */
export const gravityPalette = {
  /** Space background (clear + fade target). */
  bg: '#0a0a1a',
  /** Per-generation {h,s,l} triples (indexed by generation mod length). */
  generations: [
    { h: 220, s: 80, l: 60 },
    { h: 190, s: 85, l: 60 },
    { h: 140, s: 70, l: 55 },
    { h: 60, s: 90, l: 60 },
    { h: 30, s: 95, l: 60 },
    { h: 0, s: 85, l: 60 },
    { h: 320, s: 80, l: 65 },
    { h: 275, s: 75, l: 70 },
  ] as const,
  /** Alpha for the soft glow halo behind each body. */
  glowAlpha: 0.3,
} as const;

/* ---- LangtonAntDemo ------------------------------------------------------- */
export const langtonAntPalette = {
  bgFallback: '#f2f2f2', // --bg2
  cellFallback: '#0a0a0a', // --fg1 (filled cells)
  antFallback: '#0055ff', // --accent
} as const;

/* ---- LSystemDemo ---------------------------------------------------------
 * Two computed rgb() gradients by normalized depth t ∈ [0,1].
 *   plant   : r = plantR0 - t*plantRDelta, g = plantG0 + t*plantGDelta,
 *             b = plantB0 + t*plantBDelta
 *   fractal : r = fractalR0 + t*fractalRDelta, g = fractalG0 + t*fractalGDelta,
 *             b = fractalB0 - t*fractalBDelta  (each Math.round'd) */
export const lSystemPalette = {
  /** Plant/tree: brown trunk (t=0) → green tips (t=1). */
  plantR0: 110,
  plantRDelta: 60, // r = plantR0 - t*plantRDelta
  plantG0: 70,
  plantGDelta: 110,
  plantB0: 40,
  plantBDelta: 30,
  /** Fractals: blue (t=0) → orange (t=1). */
  fractalR0: 40,
  fractalRDelta: 200,
  fractalG0: 100,
  fractalGDelta: 60,
  fractalB0: 200,
  fractalBDelta: 160, // b = fractalB0 - t*fractalBDelta
} as const;

/* ---- MarketDemo ----------------------------------------------------------- */
export const marketPalette = {
  gridFallback: '#2a2f3a', // --border
  bgFallback: '#14181f', // --bg3 (dark)
  /** Up/down price segment + marker. */
  up: '#2ecc71',
  down: '#e74c3c',
  /** TimeSeries chart series. */
  priceSeries: '#3498db',
  volatilitySeries: '#e67e22',
} as const;

/* ---- OpinionDynamicsDemo -------------------------------------------------
 * Diverging opinion color: blue (0) → light (0.5) → red (1), two rgb()
 * branches. Substitution keeps the branch math; anchors below.
 *   o < 0.5: t=o*2   → r=lowR0+t*lowRDelta, g=lowG0+t*lowGDelta, b=lowB0+t*lowBDelta
 *   o ≥ 0.5: t=(o-.5)*2 → r=highR0-t*highRDelta, g=highG0-t*highGDelta, b=highB0-t*highBDelta */
export const opinionDynamicsPalette = {
  bgFallback: '#14181f', // --bg3 (dark)
  lowR0: 60,
  lowRDelta: 175,
  lowG0: 110,
  lowGDelta: 125,
  lowB0: 210,
  lowBDelta: 25,
  highR0: 235,
  highRDelta: 4,
  highG0: 235,
  highGDelta: 175,
  highB0: 235,
  highBDelta: 175,
  /** TimeSeries chart series. */
  polarizationSeries: '#9b59b6',
  clustersSeries: '#1abc9c',
} as const;

/* ---- ParticleLifeDemo ----------------------------------------------------
 * Particle hue spreads across the wheel: hue = (p.type / numTypes) * 360, then
 * `hsl(${hue}, ${saturation}%, ${lightness}%)`. */
export const particleLifePalette = {
  /** Background (clear + fade target). */
  bg: '#0a0a12',
  saturation: 85,
  lightness: 60,
} as const;

/* ---- PercolationDemo -----------------------------------------------------
 * Cell RGB tuples for the blitGrid loop. */
export const percolationPalette = {
  /** #555 rock. */
  rockRgb: [85, 85, 85] as const,
  /** #38bdf8 water. */
  waterRgb: [56, 189, 248] as const,
  /** #f0ebe3 open. */
  openRgb: [240, 235, 227] as const,
} as const;

/* ---- PercolationGridDemo -------------------------------------------------- */
export const percolationGridPalette = {
  fg1Fallback: '#0a0a0a', // --fg1
  fg3Fallback: '#5B6070', // --fg3
  successFallback: '#2B6E8F', // --info
  /** Cell colors (hex form; note `#f0ebe3` is used as the "skip" sentinel). */
  rock: '#777',
  water: '#38bdf8',
  open: '#f0ebe3',
  /** Failure-run outline + footer background bar. */
  failureOutline: 'rgba(0,0,0,0.15)',
  footerBar: 'rgba(0,0,0,0.08)',
} as const;

/* ---- PredatorPreyDemo ----------------------------------------------------- */
export const predatorPreyPalette = {
  bgFallback: '#14181f', // --bg3 (dark)
  prey: '#2ecc71',
  predator: '#e74c3c',
} as const;

/* ---- RigidBodyDemo -------------------------------------------------------
 * Bodies are `hsl(${b.hue}, ${sat}%, ${light}%)` (light by speed) with a
 * darker outline `hsl(${b.hue}, ${sat}%, ${outlineLight}%)`. */
export const rigidBodyPalette = {
  inkFallback: '#e6e6e6', // --fg1 (dark)
  bgFallback: '#12161c', // --bg2 (dark)
  saturation: 65,
  outlineLight: 30,
} as const;

/* ---- SegregationDemo ------------------------------------------------------
 * Demo chart series. Grid rendering literals live in segregationSimPalette. */
export const segregationDemoPalette = {
  /** Happiness TimeSeries series (--viz-1 electric blue). */
  happinessSeries: '#0055ff',
} as const;

/* ---- SettlementDemo ------------------------------------------------------- */
export const settlementPalette = {
  /** Per-settlement agent/building colors (indexed mod length). */
  settlementColors: [
    '#e74c3c',
    '#3498db',
    '#2ecc71',
    '#f39c12',
    '#9b59b6',
    '#1abc9c',
    '#e67e22',
    '#34495e',
  ] as const,
  /** Homeless wandering agent. */
  wanderer: '#e0d6c0',
  /** Trade-route link between nearby settlements. */
  tradeRoute: '#d4a843',
} as const;
/**
 * Terrain blit channels (resource/capacity RGBA math). Substitution:
 *   px[j]   = baseR + (1 - fill) * richness * darkRScale
 *   px[j+1] = baseG + fill * richness * greenGScale
 *   px[j+2] = baseB + fill * richness * greenBScale  (each Math.floor'd) */
export const settlementBlit = {
  baseR: 18,
  baseG: 18,
  baseB: 12,
  darkRScale: 40,
  greenGScale: 140,
  greenBScale: 20,
  alpha: 255,
} as const;

/* ---- SimpleModelCanvasDemo / SimpleModelWorkerDemo ------------------------ */
export const simpleModelPalette = {
  /** Active cell fill (accent at low alpha). */
  cellFill: 'rgba(215, 69, 30, 0.12)',
} as const;

/* ---- SphFluidDemo --------------------------------------------------------
 * Particle color by normalized speed t: hue = hueBase - t*hueSpan, lightness
 * = lightBase + t*lightSpan → `hsl(${hue}, ${saturation}%, ${light}%)`. */
export const sphFluidPalette = {
  bg: '#0a1020',
  hueBase: 220, // blue at rest
  hueSpan: 180, // sweeps toward red as speed rises
  saturation: 80,
  lightBase: 50,
  lightSpan: 30,
} as const;

/* ---- SpringMassDemo ------------------------------------------------------
 * Strain tint (two rgb() branches). Substitution:
 *   t≥0 (stretched): rgb(stretchR, stretchG0 - t*stretchGDelta,
 *                        stretchB0 - t*stretchBDelta)
 *   t<0 (compressed, a=-t): rgb(compressR0 - a*compressRDelta,
 *                        compressG0 - a*compressGDelta, compressB) */
export const springMassPalette = {
  /** Fixed anchor node. */
  fixedNode: '#e0e0e0',
  /** Free node. */
  freeNode: '#7ab8ff',
  /** Stretched (warm/red) branch anchors. */
  stretchR: 230,
  stretchG0: 160,
  stretchGDelta: 120,
  stretchB0: 80,
  stretchBDelta: 60,
  /** Compressed (cool/blue) branch anchors. */
  compressR0: 120,
  compressRDelta: 90,
  compressG0: 160,
  compressGDelta: 40,
  compressB: 230,
} as const;

/* ---- SugarscapeDemo ------------------------------------------------------
 * Sugar field blit + agent wealth color. Substitution:
 *   field: px[j]=fieldR0+t*fieldRScale, +1=fieldG0+t*fieldGScale,
 *          +2=fieldB0+t*fieldBScale (Math.floor)
 *   agent: `rgb(${poorR0 - wealth*wealthRDelta}, ${poorG0 + wealth*wealthGDelta},
 *          ${agentB})` (Math.floor on r,g) */
export const sugarscapePalette = {
  /** Sugar field (dark → golden) blit anchors. */
  fieldR0: 20,
  fieldRScale: 215,
  fieldG0: 18,
  fieldGScale: 190,
  fieldB0: 24,
  fieldBScale: 40,
  fieldAlpha: 255,
  /** Agent wealth color: red (poor) → green (rich). */
  poorR0: 220,
  wealthRDelta: 180, // r = poorR0 - wealth*wealthRDelta
  poorG0: 60,
  wealthGDelta: 170, // g = poorG0 + wealth*wealthGDelta
  agentB: 80, // fixed blue channel
  /** TimeSeries chart series. */
  populationSeries: '#2ecc71',
  giniSeries: '#e67e22',
} as const;

/* ---- TrafficDemo ---------------------------------------------------------
 * Velocity heat color (two rgb() branches over normalized speed t). Empty
 * cells use emptyRgb. Substitution keeps the branch lerps below. */
export const trafficPalette = {
  /** Empty road cell. */
  emptyRgb: [26, 26, 32] as const,
  /** Slow branch (t<0.5, k=t*2): lerp slowStart → slowEnd per channel. */
  slowStartR: 60,
  slowEndR: 230,
  slowStartG: 120,
  slowEndG: 210,
  slowStartB: 220,
  slowEndB: 60,
  /** Fast branch (t≥0.5, k=(t-0.5)*2): lerp fastStart → fastEnd per channel. */
  fastStartR: 230,
  fastEndR: 255,
  fastStartG: 210,
  fastEndG: 70,
  fastStartB: 60,
  fastEndB: 0,
  /** Dashed lane-divider line. */
  laneDivider: 'rgba(255,255,255,0.25)',
} as const;

/* ---- WorkerCanvasDemo ----------------------------------------------------
 * Colors come from theme fallbacks (--fg1, --bg2). */
export const workerCanvasPalette = {
  inkFallback: '#0a0a0a', // --fg1
  bgFallback: '#f2f2f2', // --bg2
} as const;

/* ---- WorldSpinnerDemo (three.js materials) -------------------------------- */
export const worldSpinnerPalette = {
  /** Point cloud (dots) color — accent. */
  dots: '#0055ff',
  /** Pulse + anchor marker spheres. */
  marker: '#F2EEE4',
  /** Globe surface. */
  globe: '#0a0a0a',
} as const;

/* ============================================================================
 * SIM-FILE PALETTES (src/sims/*.ts renderers)
 * ========================================================================== */

/* ---- sims/automatickHeroMask.ts ------------------------------------------
 * Offscreen mask rasterization fills opaque black then reads alpha. */
export const heroMaskPalette = {
  /** Mask fill (black) for the offscreen letter raster. */
  maskFill: '#000',
} as const;

/* ---- sims/chaosGameSim.ts ------------------------------------------------
 * background/color are random-hue HSLA generated at init. Substitution:
 *   background = `hsla(${randomHue}, ${bgSat}%, ${bgLight}%, ${bgAlpha})`
 *   color      = `hsla(${randomHue}, ${pointSat}%, ${pointLight}%, ${pointAlpha})` */
export const chaosGameSimPalette = {
  bgSat: 30,
  bgLight: 7,
  bgAlpha: 1,
  pointSat: 77,
  pointLight: 45,
  pointAlpha: 1,
} as const;

/* ---- sims/fibonacciSpiralSim.ts ------------------------------------------ */
export const fibonacciSpiralPalette = {
  /** Canvas background. */
  bg: '#fff',
  /** Square outline. */
  square: '#ddd',
  /** Spiral arc. */
  arc: '#222',
} as const;

/* ---- sims/mazeSim.ts ------------------------------------------------------ */
export const mazeSimPalette = {
  wall: '#000',
  path: '#fff',
} as const;

/* ---- sims/segregationSim.ts (draw) ---------------------------------------- */
export const segregationSimPalette = {
  /** Cell outline stroke. */
  outline: '#000',
  /** Community 0 (circle). */
  communityA: '#33e',
  /** Community 1 (square). */
  communityB: '#a0c',
  /** Move-trace lines/dots (stroke + fill). */
  moveTrace: '#222',
} as const;

/* ---- sims/snakeCanvas.ts -------------------------------------------------- */
export const snakeCanvasPalette = {
  primary: '#0b57d0',
  secondary: '#5c6bc0',
  accent: '#2e7d32',
  gray: '#ccc',
  /** Eye / highlight fill. */
  highlight: '#fff',
} as const;

/* ---- sims/xorRingSim.ts --------------------------------------------------- */
export const xorRingPalette = {
  /** Background. */
  bg: '#f6f6f6',
  /** Active cell. */
  cell: '#111',
} as const;

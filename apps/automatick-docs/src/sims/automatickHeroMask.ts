/**
 * Binary text mask: 1 byte per pixel, value 1 inside the letter shape, 0 outside.
 * The mask is rendered once per (text, fillW, fillH, w, h) tuple via
 * OffscreenCanvas (works in workers and on the main thread) and memoized.
 *
 * Lives outside `Data`: this is the static dataset for the hero sim. The
 * sim's `step` reads it through `getLetterMask()` to bias link-formation
 * probabilities, but the bytes themselves never round-trip through the engine.
 */

export type LetterMask = {
  width: number;
  height: number;
  /** The font size that was actually used to rasterize, after fit-to-canvas measurement. */
  fontPx: number;
  /** Row-major: index = y * width + x. 1 = inside letter shape. */
  bits: Uint8Array;
};

const cache = new Map<string, LetterMask>();

function makeKey(text: string, width: number, height: number, fillW: number, fillH: number): string {
  return `${text}|${width}|${height}|${fillW.toFixed(3)}|${fillH.toFixed(3)}`;
}

const FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const FONT_WEIGHT = '700';

function makeCanvas(width: number, height: number): {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  getImageData: () => ImageData;
} {
  if (typeof OffscreenCanvas !== 'undefined') {
    const c = new OffscreenCanvas(width, height);
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context from OffscreenCanvas');
    return { ctx, getImageData: () => ctx.getImageData(0, 0, width, height) };
  }
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context from canvas');
    return { ctx, getImageData: () => ctx.getImageData(0, 0, width, height) };
  }
  throw new Error('No canvas available to render text mask');
}

/** Font-string at a given pixel size, kept identical between measurement and rasterization. */
export function maskFontString(fontPx: number): string {
  return `${FONT_WEIGHT} ${fontPx}px ${FONT_FAMILY}`;
}

/**
 * Build a binary text mask sized to fill the canvas. The font size is chosen
 * by measurement, not heuristic: we ask the canvas API how wide the text
 * renders at a probe size, then scale to hit `fillW` of the width and
 * `fillH` of the height (whichever is the binding constraint).
 *
 * @param fillW Target fraction of canvas width the rasterized text should span.
 * @param fillH Target fraction of canvas height the rasterized text should span.
 */
export function getLetterMask(
  text: string,
  width: number,
  height: number,
  fillW = 0.94,
  fillH = 0.88
): LetterMask {
  const key = makeKey(text, width, height, fillW, fillH);
  const hit = cache.get(key);
  if (hit) return hit;

  const { ctx, getImageData } = makeCanvas(width, height);

  // Measure at a probe size, then scale linearly to hit the larger of the
  // two binding constraints. Sans-serif metrics are well-behaved enough that
  // a single probe + linear extrapolation is accurate to within a pixel.
  const probe = 100;
  ctx.font = maskFontString(probe);
  const m = ctx.measureText(text);
  const measuredW = m.width;
  const measuredH =
    (m.actualBoundingBoxAscent ?? probe * 0.75) +
    (m.actualBoundingBoxDescent ?? probe * 0.2);
  const scaleByW = (width * fillW) / measuredW;
  const scaleByH = (height * fillH) / measuredH;
  const fontPx = Math.max(16, Math.floor(probe * Math.min(scaleByW, scaleByH)));

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = maskFontString(fontPx);
  ctx.fillText(text, width / 2, height / 2);

  const img = getImageData();
  const bits = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < bits.length; i++, p += 4) {
    bits[i] = img.data[p + 3] > 127 ? 1 : 0;
  }

  const mask: LetterMask = { width, height, fontPx, bits };
  cache.set(key, mask);
  return mask;
}

export function isInsideMask(mask: LetterMask, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return false;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  return mask.bits[iy * mask.width + ix] === 1;
}

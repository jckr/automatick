/**
 * Offline thumbnail capture for the examples gallery.
 *
 * Loads each example in a headless browser, lets the simulation run for a
 * per-example warm-up, pauses it, screenshots the preview stage, and writes a
 * 16:10 PNG to public/thumbnails/<slug>.png. Run manually and commit the
 * results — thumbnails are NOT generated at runtime.
 *
 *   npm run capture:thumbnails -w automatick-docs
 *   npm run capture:thumbnails -w automatick-docs -- boids gray-scott   # subset
 *
 * Requires a browser: `npx playwright install chromium`. The "money shot" is
 * tuned per example in src/examples.ts via `warmupMs` (when) and `focus`
 * (where — a fractional crop). See AGENTS.md.
 */
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { spawn, execSync, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import fs from 'node:fs';
import path from 'node:path';
import { EXAMPLES, examplePath, type ExampleMeta } from '../src/examples.ts';

const THUMB_W = 640;
const THUMB_H = 400; // 16:10
const DEVICE_SCALE = 2; // capture at 2x for crisp downscale / zoomed crops
const DEFAULT_WARMUP_MS = 2500;
const PORT = 5179;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(docsDir, '../..');
const outDir = path.join(docsDir, 'public/thumbnails');
const viteBin = path.join(repoRoot, 'node_modules/.bin/vite');

/** Wait until the dev server answers, or throw after `timeoutMs`. */
async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`Dev server did not become ready at ${url} within ${timeoutMs}ms`);
}

/** Crop (optional fractional focus) + cover-resize a screenshot to the tile size. */
async function toThumbnail(png: Buffer, ex: ExampleMeta): Promise<Buffer> {
  let pipeline = sharp(png);
  if (ex.focus) {
    const meta = await sharp(png).metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    const left = Math.max(0, Math.round(ex.focus.x * W));
    const top = Math.max(0, Math.round(ex.focus.y * H));
    const width = Math.max(1, Math.min(W - left, Math.round(ex.focus.width * W)));
    const height = Math.max(1, Math.min(H - top, Math.round(ex.focus.height * H)));
    pipeline = sharp(png).extract({ left, top, width, height });
  }
  return pipeline
    .resize(THUMB_W, THUMB_H, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
}

async function main(): Promise<void> {
  // Restrict to slugs passed as CLI args, if any.
  const only = new Set(process.argv.slice(2));
  const targets = only.size ? EXAMPLES.filter((e) => only.has(e.slug)) : EXAMPLES;
  if (only.size && targets.length !== only.size) {
    const found = new Set(targets.map((t) => t.slug));
    const missing = [...only].filter((s) => !found.has(s));
    throw new Error(`Unknown example slug(s): ${missing.join(', ')}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  // The dev server resolves `automatick/*` to its built dist; ensure it exists.
  console.log('Building library (build:packages)…');
  execSync('npm run build:packages', { cwd: repoRoot, stdio: 'inherit' });

  console.log(`Starting dev server on :${PORT}…`);
  const server: ChildProcess = spawn(
    viteBin,
    ['--port', String(PORT), '--strictPort'],
    { cwd: docsDir, stdio: 'ignore' }
  );

  const base = `http://localhost:${PORT}`;
  const failures: string[] = [];
  try {
    await waitForServer(`${base}/`);
    const browser = await chromium.launch();
    const context = await browser.newContext({
      deviceScaleFactor: DEVICE_SCALE,
      viewport: { width: 1000, height: 820 },
    });

    for (const ex of targets) {
      const page = await context.newPage();
      try {
        const sel = ex.captureSelector ?? '.pg-sim';
        await page.goto(`${base}${examplePath(ex)}`, { waitUntil: 'load' });

        const stage = page.locator(sel).first();
        await stage.waitFor({ state: 'visible', timeout: 15_000 });
        // Best-effort: wait for the actual rendering surface to appear.
        await page
          .locator(`${sel} canvas, ${sel} [role="img"]`)
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 })
          .catch(() => {});

        // Some demos start paused (no `autoplay`); press Play so the sim
        // actually advances during the warm-up. Autoplaying demos only expose
        // a Pause button, so this is a no-op for them.
        const playBtn = page.getByRole('button', { name: 'Play', exact: true }).first();
        if (await playBtn.count()) {
          await playBtn.click({ timeout: 2000 }).catch(() => {});
        }

        // Let the simulation develop to its "money shot" moment.
        await sleep(ex.warmupMs ?? DEFAULT_WARMUP_MS);

        // Freeze it so the still is stable.
        const pauseBtn = page.getByRole('button', { name: /Pause/ }).first();
        if (await pauseBtn.count()) {
          await pauseBtn.click({ timeout: 2000 }).catch(() => {});
        }

        const shot = await stage.screenshot({ type: 'png' });
        const thumb = await toThumbnail(shot, ex);
        fs.writeFileSync(path.join(outDir, `${ex.slug}.png`), thumb);
        console.log(`  ✓ ${ex.slug}`);
      } catch (err) {
        failures.push(ex.slug);
        console.warn(`  ✗ ${ex.slug}: ${(err as Error).message}`);
      } finally {
        await page.close();
      }
    }

    await browser.close();
  } finally {
    server.kill('SIGTERM');
  }

  console.log(
    `\nDone: ${targets.length - failures.length}/${targets.length} captured → ${path.relative(repoRoot, outDir)}`
  );
  if (failures.length) {
    console.error(`Failed: ${failures.join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

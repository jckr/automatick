import { test, expect } from '@playwright/test';

test('with-react page loads and renders content', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/guide/with-react');
  await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('h1')).toHaveText('Using Automatick with React');
  // Demo should render: the SimpleModelReactDemo has a grid of cells
  await expect(page.locator('[class*="grid"]').first()).toBeVisible({ timeout: 5000 });
  // No JS errors (ignore cert warnings)
  const jsErrors = errors.filter(e => !e.includes('ERR_CERT'));
  expect(jsErrors).toEqual([]);
});

test('with-canvas page loads and renders content', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/guide/with-canvas');
  await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('h1')).toHaveText('Drawing to a canvas');
  // Demo should render a canvas element
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 5000 });
  const jsErrors = errors.filter(e => !e.includes('ERR_CERT'));
  expect(jsErrors).toEqual([]);
});

test('with-worker page loads, renders content, and shows demo canvas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/guide/with-worker');
  await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('h1')).toHaveText('Running in a Web Worker');
  // Worker demo should eventually render a canvas
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });
  const jsErrors = errors.filter(e => !e.includes('ERR_CERT'));
  expect(jsErrors).toEqual([]);
});

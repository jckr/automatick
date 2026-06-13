import { test, expect } from '@playwright/test';
import { EXAMPLES, examplePath } from '../src/examples';

test('examples gallery renders a vignette per manifest entry, each linking to its page', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/examples');
  await expect(page.locator('h1')).toHaveText('Examples', { timeout: 10000 });

  // One linked vignette per curated example.
  await expect(page.getByTestId('example-vignette')).toHaveCount(EXAMPLES.length);

  // Every example's route is represented by a tile, with its label visible.
  for (const ex of EXAMPLES) {
    const tile = page.locator(
      `a[data-testid="example-vignette"][href$="${examplePath(ex)}"]`
    );
    await expect(tile).toBeVisible();
    await expect(tile).toContainText(ex.label);
  }

  const jsErrors = errors.filter((e) => !e.includes('ERR_CERT'));
  expect(jsErrors).toEqual([]);
});

test('clicking a gallery vignette navigates to the example page', async ({ page }) => {
  await page.goto('/examples');
  await expect(page.locator('h1')).toHaveText('Examples', { timeout: 10000 });

  const first = EXAMPLES[0];
  await page
    .locator(`a[data-testid="example-vignette"][href$="${examplePath(first)}"]`)
    .click();
  await expect(page).toHaveURL(new RegExp(`${examplePath(first)}$`));
});

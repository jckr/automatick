import { expect, test } from '@playwright/test';

test('Inline counter: <Simulation> with init/step props advances on Step', async ({ page }) => {
  await page.goto('/examples/inline-counter');

  // Initial state: count = 0, tick 0.
  await expect(page.getByTestId('inline-counter-value')).toHaveText('count = 0');
  await expect(page.getByTestId('inline-counter-tick')).toHaveText('tick 0');

  // One Step click should advance both count and tick by 1.
  await page.getByRole('button', { name: /^Step/ }).first().click();

  await expect(page.getByTestId('inline-counter-value')).toHaveText('count = 1');
  await expect(page.getByTestId('inline-counter-tick')).toHaveText('tick 1');

  // Second step — verifies the engine is wired and step is being called repeatedly.
  await page.getByRole('button', { name: /^Step/ }).first().click();
  await expect(page.getByTestId('inline-counter-value')).toHaveText('count = 2');
});

test('Inline counter: Play advances the counter past 0', async ({ page }) => {
  await page.goto('/examples/inline-counter');

  await page.getByRole('button', { name: /^Play/ }).first().click();

  // Wait for the counter to tick a few times. delayMs={50} → easily >2 within 1s.
  await expect
    .poll(async () => Number((await page.getByTestId('inline-counter-tick').textContent())?.replace('tick ', '') ?? 0))
    .toBeGreaterThan(2);
});

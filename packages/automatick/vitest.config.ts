import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Anchor to this config's directory so the suite runs identically from
    // the repo root (`npm run test:unit`) and from the package
    // (`npm test -w packages/automatick`).
    root: fileURLToPath(new URL('.', import.meta.url)),
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts']
  }
});

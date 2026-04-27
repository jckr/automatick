import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/automatick/' : '/',
  plugins: [
    react(),
    // MDX support for `.mdx` pages.
    mdx()
  ],
  server: {
    port: 5173
  }
}));


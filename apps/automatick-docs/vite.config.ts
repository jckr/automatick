import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/automatick/' : '/',
  plugins: [
    react(),
    // MDX with GitHub-flavored markdown (tables, strikethrough, task lists).
    mdx({ remarkPlugins: [remarkGfm] })
  ],
  server: {
    port: 5173
  }
}));


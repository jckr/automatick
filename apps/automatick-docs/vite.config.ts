import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';

const prettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark' },
  keepBackground: false,
};

/**
 * Vite plugin that handles `?worker-module` imports. These are TypeScript
 * modules that need to be compiled to JS and emitted as separate files so a
 * Web Worker can `import()` them at runtime.
 *
 * In dev mode, resolves to the raw file URL (Vite serves .ts as JS).
 * In build mode, emits the file as a separate chunk and returns its URL.
 *
 * Usage: `import simUrl from './sim.ts?worker-module';`
 */
function workerModulePlugin(): Plugin {
  let isBuild = false;
  return {
    name: 'worker-module',
    config(_, { command }) {
      isBuild = command === 'build';
    },
    resolveId(source) {
      if (source.endsWith('?worker-module')) {
        return source;
      }
    },
    load(id) {
      if (!id.endsWith('?worker-module')) return;
      const realId = id.replace('?worker-module', '');
      if (!isBuild) {
        return `export default new URL(${JSON.stringify(realId)}, import.meta.url).href;`;
      }
      const ref = this.emitFile({ type: 'chunk', id: realId });
      return `export default import.meta.ROLLUP_FILE_URL_${ref};`;
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE_PATH || '/automatick/') : '/',
  plugins: [
    workerModulePlugin(),
    react(),
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
    }),
  ],
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
}));

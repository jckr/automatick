import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';

const prettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark' },
  keepBackground: false,
};

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/automatick/' : '/',
  plugins: [
    react(),
    // MDX with GitHub-flavored markdown (tables, strikethrough, task lists)
    // and Shiki-powered syntax highlighting via rehype-pretty-code.
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
    }),
  ],
  server: {
    port: 5173,
  },
}));

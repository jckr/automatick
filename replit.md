# automatick

A TypeScript/React library for tick-based model simulations, plus its documentation site. Structured as an npm monorepo.

## Project layout

```
packages/automatick/         — The library (npm package)
apps/automatick-docs/        — Documentation & examples site (Vite + React)
```

## How to run

The dev server starts automatically via the **Start application** workflow:

```bash
npm run dev -w apps/automatick-docs   # serves on port 5000
```

The library must be built before the docs site can import it:

```bash
npm run build:packages   # builds packages/automatick → dist/
```

The workflow runs `predev` automatically, which builds the library before starting the docs server.

## Other useful commands

```bash
npm test                              # lint + type-check + unit tests
npm run test:unit                     # vitest unit tests only
npm run test:e2e                      # playwright end-to-end tests
npm run build -w apps/automatick-docs # production build of the docs site
```

## Setup notes

- Requires Node ≥ 22.12.0 (Node 22 module is installed).
- `shell-quote` is overridden to `^1.10.0` in the root `package.json` to satisfy the Replit package security policy (pulled in transitively by `npm-run-all`).
- Vite dev server runs on port 5000 with `allowedHosts: true` for the Replit proxy.

## User preferences

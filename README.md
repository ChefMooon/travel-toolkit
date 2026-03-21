# MKT

A trip cost splitter for groups of couples. Log shared and individual expenses across multiple currencies, apply configurable cost markups, and get a clear per-couple breakdown with USD totals.

Built as a static web app deployed to Cloudflare Workers.

## Features

- **Three split modes** — shared (all couples), subset (selected couples only), or individual (one couple)
- **Multi-currency with region filtering** — log costs in any currency; select currencies by geographic region; apply exchange rates at the end to convert everything to USD
- **Cost markup** — configure a global markup percentage (e.g. a credit card foreign transaction fee); override per cost
- **Drag-and-drop reordering** of cost entries
- **Bulk currency assignment** — select multiple costs and assign a currency in one action
- **Non-paying travellers** — add children or other non-paying members without affecting the cost divisor
- **Persistent state** — all data saved to `localStorage` automatically and restored on page load
- **Start New Trip** — confirmed reset that clears all data
- **Light and dark mode**
- **Fully responsive** — mobile-optimized card layout and adaptive UI for all screen sizes

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript 5.7 |
| Build | Vite 6 |
| State | Zustand 5 (with `persist` middleware) |
| Drag & drop | @dnd-kit |
| Icons | Lucide React |
| Deployment | Cloudflare Workers (static assets) |

## Prerequisites

- Node.js 18 or later
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) for deployment (`npm install -g wrangler`)

## Development

```sh
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Build

```sh
npm run build
```

Output is written to `dist/`.

## Deploy

```sh
wrangler deploy
```

Deploys `dist/` as a static asset bundle to Cloudflare Workers. Configured in [`wrangler.toml`](wrangler.toml).

## Project Structure

```
src/
  components/       UI components
  lib/
    calculations.ts Cost splitting and summary logic
  store/
    tripStore.ts    Zustand store — all app state and actions
    types.ts        TypeScript types and constants
  App.tsx
  main.tsx
docs/
  MKT PRD.md        Product Requirements Document
  ARCHITECTURE.md   Architecture reference
  SITE-DESIGN-SPEC.md  UI and design system source of truth
```

## Testing Docs

- [Frontend Test Implementation Report](docs/plans/frontend-test-implementation-report.md)
- [Frontend Test Coverage Matrix](docs/plans/frontend-test-matrix.md)
- [Test Maintenance Guide](docs/plans/test-maintenance-guide.md)

Run tests:

```sh
npm run test -- --run
```

## License

MIT — see [LICENSE](LICENSE).


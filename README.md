# Travel Toolkit

Travel Toolkit is a travel planning toolkit built with TanStack Start and deployed to Cloudflare Workers. It combines four focused tools in one app: a trip cost splitter, a currency converter, a timezone tracker, and a destination forecast planner.

## What Travel Toolkit Includes

- **Trip Cost** — split shared, subset, or individual expenses across trip groups with multi-currency entries and USD rollups
- **Currency Converter** — compare exchange-rate snapshots across supported currencies
- **Timezone Converter** — track and customize timezones for the places that matter to your trip
- **Destination Forecast** — search destinations, inspect climate averages by date range, and surface matching events

## Features

- **Four travel tools in one app** — launch tools from the home page and move between them with the shared grid navigation
- **Flexible trip cost splitting** — use shared, subset, or individual assignment modes for each cost
- **Trip-level and per-cost markup** — set a global markup and override it on individual entries when needed
- **Multi-currency trip logging** — keep original trip currencies, filter available currencies by region, and add manual USD exchange rates for final totals
- **Bulk actions and drag-and-drop** — reorder costs and apply currencies to multiple entries at once
- **Non-paying travellers** — add children or other non-paying members without affecting the split divisor
- **Snapshot currency conversion** — convert between USD, EUR, GBP, CAD, JPY, and AUD using in-app rate snapshots
- **Configurable timezone cards** — save tracked zones, detect the browser timezone, reorder cards, and choose analog or digital display modes
- **Destination climate lookup** — search locations, choose a date range, view climate averages, and compare local time at the destination
- **Forecast event overlay** — show curated destination events that overlap with the selected trip dates
- **Persistent local state** — trip data and timezone settings are stored in `localStorage`; transient UI state stays in memory
- **Responsive theming** — adaptive layouts with light and dark theme support across the app shell

## Prerequisites

- Node.js 22.12 or later
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) for deployment

## Installation

```sh
npm install
```

## Development

```sh
npm run dev
```

The development server runs at `http://localhost:5173`.

## Analytics and Consent

Configure Google Analytics in `.env`:

```dotenv
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Behavior in the app:

- Analytics is only enabled in production builds.
- A cookie consent banner is shown on first visit.
- GA initialization and `page_view` events are blocked until analytics consent is accepted.
- Rejecting consent keeps analytics disabled.

Exclude internal/admin traffic in GA4:

1. Open **Admin** in Google Analytics.
2. Go to **Data Streams** for your web stream.
3. Create internal traffic rules for office/home public IP addresses.
4. In GA4 report filters, set internal traffic to **Exclude**.
5. Keep IP rules updated if your public IP changes.

## Basic Usage

1. Start the app and open the home page.
2. Choose a tool from the launcher grid.
3. Use the shared navigation in the top bar to switch tools without leaving the app shell.

Example workflow:

- Open **Trip Cost** to build a trip ledger, assign costs, and enter manual USD rates for final totals.
- Open **Timezone Converter** to save destination clocks for the same trip.
- Open **Destination Forecast** to search a city, pick travel dates, and check climate averages plus matching events.

## Available Routes

| Route | Tool | Purpose |
|---|---|---|
| `/` | Travel Toolkit home | Launch and navigate between tools |
| `/trip` | Trip Cost | Split group expenses and summarize totals |
| `/currency` | Currency Converter | Convert supported currencies using snapshot data |
| `/timezone` | Timezone Converter | Track and customize saved timezone cards |
| `/forecast` | Destination Forecast | Search destinations and inspect date-range climate data |
| `/blog` | Blog | Browse published articles and changelogs, with tag filtering |
| `/blog/:slug` | Blog | Read a published post using its filename-derived slug |

## Blog Content and Publishing

Published posts are Markdown files in `src/content/blog/`. A post's filename must be a unique kebab-case slug, using lowercase letters and numbers separated by single hyphens. For example, `introducing-the-travel-toolkit-blog.md` is available at `/blog/introducing-the-travel-toolkit-blog`.

Add a `.md` file with YAML frontmatter containing a non-empty `title`, a valid calendar `date` in `YYYY-MM-DD` format, a non-empty `summary`, and one or more `tags` written as lowercase letters and numbers separated by single hyphens. Write the article body in Markdown after the closing frontmatter delimiter:

```md
---
title: "A sample article"
date: "2026-09-29"
summary: "A concise description of the article."
tags:
  - travel-planning
  - changelog
---

Write the article body in Markdown.
```

Every Markdown file in `src/content/blog/` is included in the built app and is public. Keep unpublished drafts outside this directory and off the deployment branch. To publish a post, add the file, run `npm run build`, then deploy with `wrangler deploy`; the post becomes available after that deployment.

## Project Structure

```text
src/
  content/blog/    Published Markdown blog posts
  routes/          File-based route entry points for each tool page
  features/        Tool-specific modules for currency, forecast, and timezone
  components/      Shared UI and trip-cost components
  store/           Persisted and ephemeral Zustand stores
  lib/             Shared helpers, tool metadata, and core calculations
docs/
  ARCHITECTURE.md       Technical architecture reference
  Travel Toolkit PRD.md Product requirements document
  SITE-DESIGN-SPEC.md   UI and design system reference
```

## Testing

Run the full test suite:

```sh
npm run test -- --run
```

Additional testing docs:

- [Frontend Test Implementation Report](docs/plans/frontend-test-implementation-report.md)
- [Frontend Test Coverage Matrix](docs/plans/frontend-test-matrix.md)
- [Test Maintenance Guide](docs/plans/test-maintenance-guide.md)

## Build

```sh
npm run build
```

Build output is written to `dist`.

## Deploy

```sh
wrangler deploy
```

Deployment serves the built assets from `dist` using the Cloudflare SPA fallback configured in [wrangler.toml](wrangler.toml).

## Further Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/Travel Toolkit PRD.md](docs/Travel%20Toolkit%20PRD.md)
- [docs/SITE-DESIGN-SPEC.md](docs/SITE-DESIGN-SPEC.md)

## License

MIT. See [LICENSE](LICENSE).

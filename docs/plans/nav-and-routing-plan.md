# Nav Redesign, Routing Expansion, and TanStack Start Migration Plan

## Overview

This plan upgrades the application from a simple Vite React SPA into a **TanStack Start** application with:

- **TanStack Router** for file-based routing and shared layouts
- **TanStack Query** for server-state fetching, caching, and invalidation
- A new landing page and tool navigation model
- New data-oriented tool pages for currency, timezone, and forecast workflows

The existing trip planner is renamed to the **Trip Cost** page. Its core purpose remains calculating shared and split costs between trip groups.

This migration is intended to future-proof the project so additional tools and data-heavy pages can be added without reworking the application shell again.

### Design spec constraint

All new routes, shared shell changes, and page-level components must continue to follow [SITE-DESIGN-SPEC.md](../SITE-DESIGN-SPEC.md). In practice that means:

- Use the existing semantic CSS variables, typography, radius, spacing, and motion rules rather than introducing a parallel visual system.
- Preserve visible focus states, 44px touch targets in hover-less contexts, and the existing toast/modal accessibility patterns.
- Keep theme behavior available in the shared shell so it remains visible on every route.
- Preserve the existing mobile bottom-tab navigation behavior on Trip Cost unless the design spec is updated in the same change set to replace it.
- Treat any intentional visual or responsive deviation as a design-spec update in the same change set.

### Test coverage constraint

The migration must keep the current automated tests working, update affected assertions, and leave the new `/currency`, `/timezone`, and `/forecast` pages structured so they can be tested when they are implemented. Do not add page-specific test cases for those new routes in this plan; those belong with the page build work.

---

## 1. Migration Goal

### Target architecture

Move from:

- Vite SPA
- Local-only Zustand persistence
- Single top-level page structure

To:

- TanStack Start app shell
- TanStack Router file-based routes
- TanStack Query for remote data pages
- Shared root layout with page-level loaders and layouts
- Continued Zustand usage for local user-authored Trip Cost state

### Important framing: not a classic MPA

TanStack Start is not a traditional multi-page app in the old sense of fully separate frontends per route.

What it gives you instead is:

- Route-by-route document entry on first request
- Shared app shell and layouts
- Client-side navigation after hydration
- Optional SSR and streaming capabilities

That is the right model for this project: **multi-route, framework-driven, server-capable React app**, not isolated standalone pages.

---

## 2. Technology Decision

### Adopt

- `@tanstack/react-start`
- `@tanstack/react-router`
- `@tanstack/react-query`
- `@tanstack/react-router-devtools` for development only

### Keep

- React
- TypeScript
- Zustand for Trip Cost working state and local persistence
- Vitest where compatible with the new route structure

### Replace or refactor

- Replace the current single-entry app composition with TanStack Start route files
- Move global layout concerns into `__root.tsx`
- Move page-level composition into route components

### State responsibilities after migration

- **Zustand persist**: Trip Cost local draft/work state, theme, region, user-entered exchange rates
- **TanStack Query**: external or async page data such as live currency rates, forecasts, timezone lookup data, destination metadata
- **TanStack Router / Start**: route structure, route loaders, page boundaries, layout hierarchy
- **Shared design system**: CSS variables, typography, card surfaces, modal/toast styling, and responsive layout rules defined by the site design spec

---

## 3. Route Structure

Create the following route tree:

| Route | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Tool-launcher home |
| `/trip` | `TripCostPage` | Shared/split trip cost calculator |
| `/currency` | `CurrencyPage` | Currency converter with fetched rate data |
| `/timezone` | `TimezonePage` | Timezone comparison tool |
| `/forecast` | `ForecastPage` | Destination forecast tool |

### TanStack Start file structure

```tsx
src/routes/
  __root.tsx
  index.tsx
  trip.tsx
  currency.tsx
  timezone.tsx
  forecast.tsx
```

### Route responsibilities

- `__root.tsx`: global providers, root layout, navbar, toasts, outlet
- `index.tsx`: landing page only
- `trip.tsx`: Trip Cost toolbar + Trip Cost experience
- `currency.tsx`: currency converter page using TanStack Query
- `timezone.tsx`: timezone tools, likely query-backed lookup/search
- `forecast.tsx`: forecast UI and weather data queries

---

## 4. Root Application Shell

The Start root route becomes the global application shell.

### `__root.tsx` should own

- `QueryClientProvider`
- top-level layout wrapper
- global `Navbar`
- `ToastViewport`
- shared theme toggle so the active theme remains visible and accessible on every route
- shared theme class application if still managed in React
- route outlet

### Example intent

```tsx
export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Navbar />
        <ToastViewport />
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  )
}
```

### Why this matters

- Every page shares navigation and global UI consistently
- Query cache persists across route transitions
- Page-specific controls can be kept out of the global shell

---

## 5. Global Navbar Refactor

### Remove from the global navbar

The following are Trip Cost-specific and should not live in the root shell:

- Trip name input / dropdown
- Markup percentage pill/control
- New Trip button

### Keep in the global navbar

- App logo
- Grid navigation button using `/grid.svg` from `public/grid.svg`
- Theme toggle, so the active theme remains visible across landing and tool pages

### Icon usage in the navbar

- The grid trigger should render `/grid.svg` directly from `public/grid.svg`.
- The trigger icon stays separate from the tool icons used inside the panel.

### Navbar intent

```tsx
export function Navbar() {
  return (
    <nav className="navbar">
      <AppLogo />
      <GridNavButton />
      <ThemeToggle />
    </nav>
  )
}
```

---

## 6. Grid Navigation Panel

The grid panel opens from the navbar and provides navigation to all tools.

### Behaviour

- Clicking the grid icon toggles the panel
- Clicking outside closes it
- Navigating closes it
- On mobile it becomes a full-screen overlay
- On larger screens it becomes an anchored dropdown panel

### Panel content

| Icon | Label | Route |
|---|---|---|
| `trip-cost.svg` | Trip Cost | `/trip` |
| `currency.svg` | Currency | `/currency` |
| `timezone.svg` | Timezones | `/timezone` |
| `forecast.svg` | Forecast | `/forecast` |

### Navigation implementation

Use TanStack Router navigation helpers rather than ad hoc window navigation.

### Grid panel icon usage

- Render the icon from `tool.icon` for each grid panel item.
- Use `/trip-cost.svg`, `/currency.svg`, `/timezone.svg`, and `/forecast.svg` from `public/`.
- Keep the grid panel icons aligned with the landing page cards by reading from the same `TOOLS` registry.

```tsx
export function GridPanel({ open, onClose }: Props) {
  const navigate = useNavigate()

  return open ? (
    <>
      <div className="grid-panel-backdrop" onClick={onClose} />
      <div className="grid-panel">
        {TOOLS.map((tool) => (
          <button
            key={tool.route}
            className="grid-panel-item"
            onClick={() => {
              navigate({ to: tool.route })
              onClose()
            }}
          >
            <img src={tool.icon} alt="" />
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
    </>
  ) : null
}
```

### Asset mapping

- Navbar trigger: `/grid.svg` from `public/grid.svg`
- Trip Cost: `/trip-cost.svg` from `public/trip-cost.svg`
- Currency: `/currency.svg` from `public/currency.svg`
- Timezones: `/timezone.svg` from `public/timezone.svg`
- Forecast: `/forecast.svg` from `public/forecast.svg`

---

## 7. Trip Cost Page

The Trip Cost page remains the main local-first workflow in the app.

### Purpose

- Manage trip participants/groups
- Enter costs
- Assign split rules
- Persist work locally between sessions
- Produce per-group summaries

### Keep on Zustand persist

Trip Cost data is user-authored working state, not remote server state. It should remain in Zustand with `persist` unless and until the app gains authenticated cloud saves.

### Trip-specific toolbar

Render a page-scoped toolbar only on `/trip` containing:

- Trip name input/selector
- Markup control
- New Trip button

The toolbar should inherit the shared shell theme state instead of owning theme controls itself.

### Page structure

```tsx
export const Route = createFileRoute('/trip')({
  component: TripCostPage,
})

function TripCostPage() {
  return (
    <>
      <TripToolbar />
      <TripCostContent />
    </>
  )
}
```

---

## 8. Landing Page (`/`)

The landing page becomes the default entry route and launches users into a tool.

### Layout

- Single-column stacked cards on mobile and tablet to match the existing dense, one-column app flow
- Two-column card grid on desktop
- Three or four columns only on large desktop where the layout has room without reducing tap targets or legibility

The landing page should still feel like part of the same editorial UI system as Trip Cost: compact cards, clear hierarchy, subdued surfaces, and theme-aware accents.

### Each card includes

- icon
- title
- one-line description
- click target that navigates through TanStack Router

### Tool data

```ts
export const TOOLS = [
  {
    route: '/trip',
    label: 'Trip Cost',
    description: 'Calculate shared and split costs across trip groups.',
    icon: '/trip-cost.svg',
  },
  {
    route: '/currency',
    label: 'Currency Converter',
    description: 'Convert between currencies with live rates.',
    icon: '/currency.svg',
  },
  {
    route: '/timezone',
    label: 'Timezone Converter',
    description: 'Compare times across multiple destinations.',
    icon: '/timezone.svg',
  },
  {
    route: '/forecast',
    label: 'Destination Forecast',
    description: 'Check weather forecasts before you travel.',
    icon: '/forecast.svg',
  },
]
```

### Landing page icon usage

- Render each card image from `tool.icon`.
- Use the same `TOOLS` registry for the grid panel and landing page to avoid drift.

Example:

```tsx
{TOOLS.map((tool) => (
  <button key={tool.route} className="tool-card" onClick={() => navigate({ to: tool.route })}>
    <img src={tool.icon} alt="" />
    <span className="tool-card-label">{tool.label}</span>
    <span className="tool-card-desc">{tool.description}</span>
  </button>
))}
```

---

## 9. New Data Pages and Query Strategy

The new pages should be built as query-backed routes.

### `/currency`

Use TanStack Query for:

- live exchange rate fetches
- stale-time caching
- retry/error/loading states
- invalidation when the base currency or amount context changes

UI requirements:

- Use the same card, input, and typography tokens as the Trip Cost page.
- Keep loading, empty, success, and error states aligned with the existing toast and surface patterns.
- Do not introduce page-specific colors outside the shared semantic palette.

### `/timezone`

Use TanStack Query for:

- destination/city search lookups
- timezone metadata lookup
- cached search results where appropriate

UI requirements:

- Reuse the shared shell and control styling instead of inventing new page chrome.
- Keep search results readable in both themes and preserve keyboard navigation and focus states.

### `/forecast`

Use TanStack Query for:

- forecast request lifecycle
- cache windows by destination/date range
- refetch controls for stale weather data

UI requirements:

- Use the same surface hierarchy, spacing rhythm, and motion limits defined by the design spec.
- Ensure forecast cards and status states remain legible on mobile without depending on hover.

### Query design rules

- Keep query keys explicit and stable
- Route params and search params should feed query keys
- Use route loaders only to prime data or validate route input where helpful
- Keep fetched data out of Zustand unless it must become editable local draft state

---

## 10. Shared Tool Registry

Keep landing page and grid panel in sync through one shared source of truth.

```ts
// src/lib/tools.ts
export type Tool = {
  route: '/trip' | '/currency' | '/timezone' | '/forecast'
  label: string
  description: string
  icon: string
}

export const TOOLS: Tool[] = [
  {
    route: '/trip',
    label: 'Trip Cost',
    description: 'Calculate shared and split costs across trip groups.',
    icon: '/trip-cost.svg',
  },
  {
    route: '/currency',
    label: 'Currency Converter',
    description: 'Convert between currencies with live rates.',
    icon: '/currency.svg',
  },
  {
    route: '/timezone',
    label: 'Timezone Converter',
    description: 'Compare times across destinations.',
    icon: '/timezone.svg',
  },
  {
    route: '/forecast',
    label: 'Destination Forecast',
    description: 'Check weather forecasts before travel.',
    icon: '/forecast.svg',
  },
]
```

---

## 11. Project Structure After Migration

Suggested high-level structure:

```tsx
src/
  routes/
    __root.tsx
    index.tsx
    trip.tsx
    currency.tsx
    timezone.tsx
    forecast.tsx
  components/
    Navbar/
    GridPanel/
    ToastViewport/
    ...
  features/
    trip-cost/
    currency/
    timezone/
    forecast/
  lib/
    tools.ts
    queryClient.ts
    ...
  store/
    tripStore.ts
    toastStore.ts
```

### Notes

- `features/` should hold page-specific components, hooks, and data helpers
- `lib/queryClient.ts` should centralize Query client creation and defaults
- existing shared UI components can stay in `components/`
- Any UI shared across routes should continue to consume the design tokens and interaction rules from the site design spec rather than duplicating styles in feature folders.
- The existing test files in `src/**/*.test.tsx` and the store/lib tests should be updated alongside the route refactor so they continue to pass against the new shell and route structure.

---

## 12. Migration Steps

Complete the migration in this order to reduce breakage:

1. Install TanStack Start, Router, and Query dependencies.
2. Add Start configuration and generate the initial route shell.
3. Create `src/routes/__root.tsx` and move global shell responsibilities there.
4. Create `src/routes/index.tsx` for the landing page.
5. Move the current app experience into `src/routes/trip.tsx` and rename it to Trip Cost.
6. Create stub routes for `currency`, `timezone`, and `forecast`.
7. Add `QueryClientProvider` and shared query client configuration.
8. Extract `TOOLS` into `src/lib/tools.ts`.
9. Build `GridPanel` and wire it into the global navbar.
10. Remove Trip Cost-specific controls from the navbar and place them in `TripToolbar`.
11. Add TanStack Query hooks for each new data-backed page.
12. Update and fix the current automated tests so they pass against the new root shell, navbar split, and `/trip` layout.
13. Add test-ready structure for `/currency`, `/timezone`, and `/forecast` without adding their page-specific tests yet.
14. Validate route transitions, hydration, layout rendering, persisted Trip Cost state, and query cache behavior.
15. Verify that the landing page, `/trip`, and all new tool pages still conform to the existing responsive, modal, toast, and focus-state rules in [SITE-DESIGN-SPEC.md](../SITE-DESIGN-SPEC.md).

---

## 13. Data and Persistence Rules

To avoid architecture drift, use these rules going forward:

### Use Zustand persist when

- the state is user-authored
- the state should survive browser reloads locally
- the state is primarily form/draft/workflow state

Examples:

- Trip Cost entries
- selected groups and assignments
- user-entered override values
- theme preference

### Use TanStack Query when

- the data is fetched asynchronously
- the data has freshness concerns
- caching, retries, and invalidation matter
- the source of truth is external to the component tree

### Use the design spec when

- defining any new visual hierarchy, spacing, or responsive behavior
- choosing card, modal, toast, navigation, or focus interaction patterns
- deciding whether a proposed UI change is a true feature change or a design-spec update

Examples:

- exchange rates
- weather forecasts
- timezone lookup results

---

## 14. Testing and Verification

After migration, verify:

1. Direct navigation to each route works on refresh.
2. Root layout renders navbar and toasts on every page.
3. Shared shell theme control is visible and functional on every route.
4. `/trip` still persists user work between sessions.
5. Query-backed pages handle loading, empty, success, and error states.
6. Landing page and grid panel stay synchronized via `TOOLS`.
7. Landing page, `/trip`, and the new tool pages preserve the design spec's responsive, focus, touch-target, modal, and toast rules.
8. Mobile navigation behavior either matches the existing bottom-tab rule or is explicitly covered by a design spec update.
9. The current test suite has been updated and passes against the new route structure.
10. Cloudflare deployment still serves the built app correctly under the Start build output approach you choose.

---

## 15. Risks and Tradeoffs

### Benefits

- Stronger long-term route structure
- Better separation of local state vs remote data
- Cleaner onboarding path for additional tools
- Better support for SSR/streaming if needed later

### Costs

- Larger migration than a navbar-only refactor
- Route architecture and build setup become more opinionated
- Existing tests may need updates for route providers and query providers
- Cloudflare deployment may require configuration updates depending on the final Start adapter/output mode

### Recommendation

Proceed with the TanStack Start migration if the new tools are a genuine product direction rather than one-off pages. If the app is becoming a travel tools platform, this upgrade is justified.

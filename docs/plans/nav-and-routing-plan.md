# Nav Redesign & Routing Expansion Plan

## Overview

This document outlines the changes required to refactor the global navbar, introduce a grid-panel navigation overlay, add a tool-launcher landing page, and wire up three new tool routes. The app is a **TanStack Start / TanStack Router** SPA with a React UI.

---

## 1. Route Structure

Add or update the following routes:

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Tool-launcher home — grid of all tool cards |
| `/trip` | `TripPage` | Existing trip planner (currently at root) |
| `/budget` | `BudgetPage` | Budget & expense tracker (new) |
| `/currency` | `CurrencyPage` | Currency converter (new) |
| `/timezone` | `TimezonePage` | Timezone converter (new) |
| `/forecast` | `ForecastPage` | Destination weather forecast (new) |

### TanStack Router config

Create or update the route tree. All tool pages should share the `__root` layout so the global navbar renders on every page.

```
routes/
  __root.tsx          ← global layout: navbar only
  index.tsx           ← LandingPage
  trip.tsx            ← TripPage (moved from root)
  budget.tsx          ← BudgetPage (new)
  currency.tsx        ← CurrencyPage (new)
  timezone.tsx        ← TimezonePage (new)
  forecast.tsx        ← ForecastPage (new)
```

If using file-based routing (TanStack Start default), the filenames above map automatically. If using a manual `routeTree`, register each new route in `createRouter`.

---

## 2. Global Navbar Refactor

### What to remove from the navbar
The following elements currently in the navbar are **trip-specific** and must be removed from the global layout:

- Trip name input / dropdown (`My Trip`)
- Markup percentage pill (`Markup 66%`)
- New Trip button
- Dark mode toggle

These will be relocated to a **trip page toolbar** (see Section 4).

### What stays in the global navbar
The global navbar after refactor contains only:

- App logo (left)
- Grid navigation icon (right) — uses `grid.svg` provided in the project

### Navbar component changes (`Navbar.tsx` or equivalent)

```tsx
// Before: navbar contained trip-specific controls
// After: lean global shell

export function Navbar() {
  return (
    <nav className="navbar">
      <AppLogo />
      <GridNavButton />  {/* opens GridPanel overlay */}
    </nav>
  )
}
```

---

## 3. Grid Navigation Panel

A panel that opens when the grid icon is clicked. Renders on all screen sizes using the same trigger (`grid.svg` icon in the navbar).

### Behaviour
- Clicking the grid icon toggles the panel open/closed
- Clicking outside the panel closes it
- Navigating to a route closes it
- On mobile the panel should render as a **full-screen overlay** (100vw × 100vh) for thumb accessibility
- On tablet/desktop it renders as a **dropdown panel** anchored to the top-right navbar icon

### Panel content
A 2-column icon grid with one card per tool:

| Icon | Label | Route |
|---|---|---|
| *(app icon)* | Trip Planner | `/trip` |
| *(budget icon)* | Budget | `/budget` |
| *(currency icon)* | Currency | `/currency` |
| *(clock icon)* | Timezones | `/timezone` |
| *(cloud icon)* | Forecast | `/forecast` |

### Component structure

```tsx
// GridPanel.tsx
export function GridPanel({ open, onClose }: Props) {
  const navigate = useNavigate()

  const tools = [
    { label: 'Trip Planner', icon: '...', route: '/trip' },
    { label: 'Budget',       icon: '...', route: '/budget' },
    { label: 'Currency',     icon: '...', route: '/currency' },
    { label: 'Timezones',    icon: '...', route: '/timezone' },
    { label: 'Forecast',     icon: '...', route: '/forecast' },
  ]

  return open ? (
    <>
      <div className="grid-panel-backdrop" onClick={onClose} />
      <div className="grid-panel">
        {tools.map(t => (
          <button
            key={t.route}
            className="grid-panel-item"
            onClick={() => { navigate({ to: t.route }); onClose() }}
          >
            <img src={t.icon} alt="" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </>
  ) : null
}
```

### Responsive CSS (key rules)

```css
/* Mobile: full-screen overlay */
@media (max-width: 640px) {
  .grid-panel {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 2rem;
    gap: 1rem;
  }
}

/* Tablet / desktop: anchored dropdown */
@media (min-width: 641px) {
  .grid-panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 240px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px;
    border-radius: 12px;
  }
}
```

---

## 4. Trip Page Toolbar

The trip-specific UI that was removed from the global navbar moves into a **secondary toolbar** rendered only on `/trip`.

### Elements to restore here
- Trip name input/selector
- Markup percentage control
- New Trip button
- Dark mode toggle

### Placement
Render this toolbar directly below the global navbar, inside the `TripPage` component (or a `TripLayout` wrapper if preferred). It should **not** be in `__root.tsx`.

```tsx
// trip.tsx
export function TripPage() {
  return (
    <>
      <TripToolbar />   {/* markup %, trip name, new trip, dark mode */}
      <TripContent />
    </>
  )
}
```

---

## 5. Landing Page (`/`)

A tool-launcher home screen. The primary job is to get the user into a tool in one click.

### Layout
- Full-width card grid, responsive: 2 columns on mobile, 3 on tablet, 3–4 on desktop
- Each card contains:
  - Tool icon (SVG or image)
  - Tool name (heading)
  - Short one-line description

### Tool card data

```ts
export const tools = [
  {
    route: '/trip',
    label: 'Trip Planner',
    description: 'Build and price out a full trip itinerary.',
  },
  {
    route: '/budget',
    label: 'Budget Tracker',
    description: 'Track expenses and set spending limits.',
  },
  {
    route: '/currency',
    label: 'Currency Converter',
    description: 'Convert between currencies with live rates.',
  },
  {
    route: '/timezone',
    label: 'Timezone Converter',
    description: 'Compare times across multiple destinations.',
  },
  {
    route: '/forecast',
    label: 'Destination Forecast',
    description: 'Check weather forecasts before you travel.',
  },
]
```

### Component

```tsx
// index.tsx (LandingPage)
export function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="landing">
      <h1>Where to next?</h1>
      <div className="tool-grid">
        {tools.map(t => (
          <button
            key={t.route}
            className="tool-card"
            onClick={() => navigate({ to: t.route })}
          >
            <ToolIcon route={t.route} />
            <span className="tool-card-label">{t.label}</span>
            <span className="tool-card-desc">{t.description}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
```

---

## 6. New Tool Pages (Stubs)

Create stub components for each new route. These can be fleshed out in follow-up tasks.

### `/budget` — Budget Tracker
- Placeholder for expense entry UI
- Will need: line items, category tags, currency selector, total vs budget display

### `/currency` — Currency Converter
- Placeholder for conversion UI
- Will need: amount input, from/to currency selectors, live exchange rate fetch

### `/timezone` — Timezone Converter
- Placeholder for timezone comparison UI
- Will need: city/zone search, time input, multi-zone output list

### `/forecast` — Destination Forecast
- Placeholder for weather UI
- Will need: destination search, date range picker, forecast display (temp, conditions)

Each stub should export a named component and be registered in the route tree:

```tsx
// Example: currency.tsx
export const Route = createFileRoute('/currency')({
  component: CurrencyPage,
})

function CurrencyPage() {
  return <div>Currency Converter — coming soon</div>
}
```

---

## 7. Shared Tool Registry

To keep the grid panel and landing page in sync without duplicating data, extract tool metadata into a single shared file:

```ts
// src/lib/tools.ts
export type Tool = {
  route: string
  label: string
  description: string
  icon: string   // path to SVG asset
}

export const TOOLS: Tool[] = [
  { route: '/trip',      label: 'Trip Planner',       description: '...', icon: '/icons/trip.svg' },
  { route: '/budget',    label: 'Budget Tracker',      description: '...', icon: '/icons/budget.svg' },
  { route: '/currency',  label: 'Currency Converter',  description: '...', icon: '/icons/currency.svg' },
  { route: '/timezone',  label: 'Timezone Converter',  description: '...', icon: '/icons/timezone.svg' },
  { route: '/forecast',  label: 'Destination Forecast',description: '...', icon: '/icons/forecast.svg' },
]
```

Both `GridPanel` and `LandingPage` import from `src/lib/tools.ts`. Adding a new tool in future means updating this file only.

---

## 8. Implementation Order

Complete tasks in this order to avoid breaking the existing trip planner mid-way:

1. **Create `src/lib/tools.ts`** — shared tool registry
2. **Create stub route files** for `/budget`, `/currency`, `/timezone`, `/forecast`
3. **Register all routes** in the TanStack Router route tree
4. **Build `GridPanel`** component (closed by default, no visual regression yet)
5. **Refactor `Navbar`** — strip trip-specific elements, add `GridPanel` trigger using `grid.svg`
6. **Add `TripToolbar`** to `TripPage` — restore the removed trip-specific controls here
7. **Build `LandingPage`** at `/` using `TOOLS` registry
8. **Update default redirect** — if the app previously loaded trip planner at `/`, add a redirect or move it to `/trip`
9. **Smoke test** all routes and responsive grid panel behaviour

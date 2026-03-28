# Climate Summary — Hero Layout Implementation Plan

## Overview

Redesign the **Climate Summary** section from a uniform flat card grid into a hero + supporting grid layout. The average mean temperature is promoted to a large focal stat on the left; all other stats occupy a tight 2×3 grid to the right. The existing "More Details" expand is removed — all stats are visible at once. The layout adapts across desktop, tablet, and mobile breakpoints.

---

## 1. Layout Structure

### 1.1 Desktop (≥ 900px)

```
┌─────────────────────────────────────────────────────┐
│ CLIMATE SUMMARY                                     │
│                                                     │
│ ┌──────────────┐  ┌────────┐ ┌────────┐ ┌────────┐ │
│ │              │  │ Precip │ │ Sun    │ │Daylight│ │
│ │   Avg Mean   │  │ 2.8    │ │ 0 hrs  │ │ 13 hrs │ │
│ │    7.6 °C    │  ├────────┤ ├────────┤ ├────────┤ │
│ │ Hi 11° Lo 4° │  │Rainfall│ │Snowfall│ │  Wind  │ │
│ │              │  │ 2.7    │ │ 0.1    │ │ 23.3   │ │
│ └──────────────┘  └────────┘ └────────┘ └────────┘ │
└─────────────────────────────────────────────────────┘
```

- Two-column grid: `grid-template-columns: 220px 1fr`
- Hero card occupies the full height of the left column
- Right column: `display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 8px`

### 1.2 Tablet (600px – 899px)

- Switch to single column stacked layout
- Hero card goes full width, but reduces in height — display temp large, high/low inline beneath
- Supporting stats: `grid-template-columns: repeat(3, 1fr)` in two rows (same 3×2 grid, now full width below the hero)

### 1.3 Mobile (< 600px)

- Hero card: full width, compact — temp prominent, high/low inline, reduced padding
- Supporting stats: `grid-template-columns: repeat(2, 1fr)` — 3 rows of 2 cards
- Card padding reduced to keep content readable without overflow

---

## 2. Component Structure

Adapt to your existing project conventions. Suggested breakdown:

```
components/
  weather/
    ClimateSummary/
      index.tsx              ← section wrapper; reads data, renders header + layout
      HeroCard.tsx           ← large mean temp card
      StatCard.tsx           ← reusable supporting stat card (icon + label + value)
```

If the existing `ClimateSummary` is a single file component, the hero and stat card can be defined as local sub-components or inline JSX within the same file.

---

## 3. Hero Card — Spec

Displays the **Avg Mean Temperature** as the primary focal point.

### Content

| Element | Detail |
|---|---|
| Icon | Thermometer icon (from existing icon library) |
| Label | `Avg Mean Temp` — small, muted, uppercase |
| Value | Large number (e.g. `7.6`) with `°C` unit inline, smaller weight |
| Sub-label | `High 11.2° · Low 4.1°` — small muted text below the value |

### Sizing

- Desktop: value at `~52px`, fills the full left column height
- Tablet: value at `~44px`, height collapses to auto
- Mobile: value at `~38px`

### Styling

- Same background and border treatment as the rest of the existing card system (no new styles needed)
- Center-aligned content (icon → label → value → sub-label, stacked vertically)
- Icon at `~28px`, muted opacity

---

## 4. Stat Card — Spec

Reusable card for the 6 supporting stats. Props:

```ts
interface StatCardProps {
  icon: ReactNode       // icon component from existing library
  label: string         // e.g. "Precipitation"
  value: string | number
  unit: string          // e.g. "mm/day"
}
```

### Content layout (within each card)

```
[icon]  LABEL
VALUE unit
```

- Icon + label on a single row (icon small, ~16px; label uppercase, muted, ~11px)
- Value on the next line: `~22px`, medium weight; unit inline at `~12px`, muted

### 6 supporting stats

| Label | Value | Unit | Icon (use existing) |
|---|---|---|---|
| Precipitation | 2.8 | mm/day | rain / precipitation icon |
| Sunshine | 0 | hrs/day | sun icon |
| Daylight | 13 | hrs/day | sunrise / daylight icon |
| Rainfall | 2.7 | mm/day | droplet icon |
| Snowfall | 0.1 | cm/day | snowflake icon |
| Max Wind | 23.3 | km/h | wind icon |

Use the icons already present in the existing daily breakdown cards for consistency — they use the same stat vocabulary.

---

## 5. Responsive Breakpoints

### Implementation approach

Use CSS Grid with `@media` queries (or Tailwind responsive prefixes if the project uses Tailwind):

```css
/* Desktop: side-by-side */
.cs-body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 12px;
}

/* Tablet */
@media (max-width: 899px) {
  .cs-body {
    grid-template-columns: 1fr;
  }
  .hero-card {
    height: auto;
    padding: 20px;
  }
  .hero-value {
    font-size: 44px;
  }
}

/* Mobile */
@media (max-width: 599px) {
  .support-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-value {
    font-size: 38px;
  }
  .stat-card {
    padding: 10px 12px;
  }
}
```

If using Tailwind, equivalent classes:
- Desktop body grid: `grid grid-cols-[220px_1fr] gap-3`
- Tablet override: `md:grid-cols-1`
- Support grid: `grid grid-cols-2 sm:grid-cols-3`

### Hero card — tablet/mobile behaviour

On tablet and mobile the hero card switches from a tall centered column to a wide compact band. To avoid it looking too sparse at full width, keep it left-aligned on tablet/mobile rather than centered:

- Mobile/tablet: `flex-direction: row; align-items: center; gap: 16px; text-align: left`
- Icon + value side-by-side, sub-label (high/low) on the right or below the value

This mirrors common weather app patterns (the large temp on the left with metadata to its right) and avoids a big awkward centered block at full mobile width.

---

## 6. Removing "More Details" Expand

The existing "More Details" accordian/expand section can be removed entirely — rainfall, snowfall, and wind are now promoted into the main 6-card grid. Ensure the following:

- Remove the expand toggle button and any associated state (`isExpanded`, `showDetails`, etc.)
- Remove the conditional render block for the expanded stats
- Confirm the 4 previously-hidden stats (Avg Rainfall, Avg Snowfall, Avg Total Precipitation, Max Wind Speed) are now represented in the supporting grid. Note: `Total Precipitation` and `Precipitation` are very similar values — consider whether both need to be shown. If not, drop `Total Precipitation` and keep `Precipitation`, `Rainfall`, and the rest.

---

## 7. Data / Props

No changes to the data fetching layer. The component already receives all required fields. Confirm the data shape includes:

```ts
interface ClimateSummaryData {
  avgMeanTemp: number
  avgHighTemp: number
  avgLowTemp: number
  precipitation: number        // mm/day
  sunshine: number             // hrs/day
  daylight: number             // hrs/day
  avgRainfall: number          // mm/day
  avgSnowfall: number          // cm/day
  avgMaxWindSpeed: number      // km/h
}
```

---

## 8. Acceptance Criteria

- [ ] Desktop: hero card occupies left column at fixed `220px` width; supporting 3×2 grid fills the right
- [ ] Tablet (600–899px): hero card goes full width with horizontal inner layout; 3×2 stat grid below at full width
- [ ] Mobile (<600px): hero card full width compact; stat grid collapses to 2-column (3 rows)
- [ ] No "More Details" expand toggle — all 6 supporting stats are always visible
- [ ] Avg Mean temp is the visually dominant element at all breakpoints
- [ ] High/Low displayed as a sub-label beneath the hero value
- [ ] All icons sourced from the existing icon library — no new dependency added
- [ ] Styling consistent with the rest of the weather UI (card backgrounds, borders, typography)
- [ ] No horizontal overflow at any breakpoint

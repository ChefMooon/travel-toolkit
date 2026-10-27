# Style Guide

Companion to [SITE-DESIGN-SPEC.md](./SITE-DESIGN-SPEC.md). This document covers recurring CSS patterns that must be applied consistently across the codebase. When SITE-DESIGN-SPEC and this document conflict, prefer SITE-DESIGN-SPEC.

---

## Home page tool cards

Each home page tool card has a distinct accent inspired by the trip-cost group
palette. The complete named palette and its light and dark values live in
[`COUPLE_COLORS`](../src/store/types.ts); the first five Pressed Flowers colors
also have CSS tokens near the top of [`src/index.css`](../src/index.css). The
home-card shades are contrast-adjusted derivatives, not exact copies of those
values. Choose a recognizable palette hue that is distinct from the existing
cards, then tune it separately for each theme.

| Tool | Palette inspiration | Card class |
|---|---|---|
| Trip Cost | Rose | `.tool-card--trip` (uses the base card's rose defaults) |
| Currency Converter | Sage | `.tool-card--currency` |
| Timezone Tracker | Periwinkle | `.tool-card--timezone` |
| Destination Forecast | Tan, adjusted toward amber | `.tool-card--forecast` |

The tool list is defined in [`src/lib/tools.ts`](../src/lib/tools.ts), and
[`src/routes/index.tsx`](../src/routes/index.tsx) derives each card class from
its route. Card-specific color variables and dark-theme overrides live in the
`.tool-card` section of `src/index.css`. Keep colors tied to the tool route,
not its position in the grid, so reordering tools does not change their colors.

When adding a tool, select an unused palette hue where practical and define
light and dark values for `--card-edge`, `--card-start`, `--card-end`,
`--card-icon`, and `--card-icon-bg` under its route class. The edge is solid at
rest; hover uses a stationary two-color gradient. Keep the border static; a
subtle card lift and shadow transition may provide hover feedback when motion
is allowed. Keep the separate focus outline and forced-colors fallback.
The navigation popover reuses these route classes and color variables for its
compact cards and icon tiles, so the same tool keeps its color in both places.

Check contrast in both themes against the actual adjacent colors: the resting
edge and every part of the hover gradient must reach at least 3:1 against the
page background, and the icon must remain distinguishable from its tile. Check
the focus outline as well. Palette colors and soft group borders are starting
points, not a guarantee of sufficient contrast; adjust the shades as needed.

## Scrollbars

All scrollable surfaces use the same visual pattern: a thin, floating thumb over a transparent track. The thumb color derives from `--border-2` (adapts to light/dark theme automatically). No custom background is ever used for the track inside modals or panels.

### Standard pattern

Every scrollable element requires both the Firefox shorthand and the WebKit triple to appear consistent across browsers.

```css
.my-scrollable {
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: var(--border-2) transparent;
}

.my-scrollable::-webkit-scrollbar {
  width: 8px;           /* vertical; use height: 8px for horizontal */
}

.my-scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.my-scrollable::-webkit-scrollbar-thumb {
  background: var(--border-2);
  border-radius: 999px;
  border: 2px solid transparent;  /* inset gap from container edge */
  background-clip: padding-box;   /* required for border trick to show through */
}
```

### Horizontal scrollbars

Same pattern, swap `width` for `height` on the track, and set `height: 8px` on `::-webkit-scrollbar`.

```css
.my-h-scrollable {
  scrollbar-width: thin;
  scrollbar-color: var(--border-2) transparent;
}

.my-h-scrollable::-webkit-scrollbar {
  height: 8px;
}

.my-h-scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.my-h-scrollable::-webkit-scrollbar-thumb {
  background: var(--border-2);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
```

### Body / page scrollbar

The page-level (`html, body`) scrollbar is the only surface allowed to use a non-transparent track. It uses a semi-opaque variant of `--bg` so the scrollbar is visible against the page background:

```css
html,
body {
  scrollbar-width: thin;
  scrollbar-color: var(--border-2) color-mix(in srgb, var(--bg) 80%, transparent 20%);
}

body::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--bg) 82%, transparent 18%);
}
```

Do not apply a colored track to any component-level scrollable (panels, modals, sidebars). Use **transparent** only.

### Responsive overrides

Mobile breakpoint (`max-width: 767px`) narrows the body and panel scrollbars to 7px to reduce visual weight on small screens:

```css
@media (max-width: 767px) {
  body::-webkit-scrollbar {
    width: 7px;
  }

  .save-data-panel::-webkit-scrollbar {
    width: 7px;
  }
}
```

Apply the same override for any new large panel that appears on mobile.

## Page entrance motion

Stable top-level page containers use the shared `fadeUp` entrance in
`src/index.css`: 420 ms, an initial 14 px vertical offset, and ease timing.
Apply `data-page-entrance` to the page's `<main>` when it enters on navigation.
The animation uses backwards fill so the starting state applies before it runs
without retaining a transform after completion. This avoids changing fixed
positioning or stacking behavior once the entrance finishes.

Use the entrance once per page mount. Do not add it to live result lists,
changing cards, or filter updates, since those updates should not replay the
page motion. If a route renders different article content for a changed slug,
key the page container by that slug so a newly selected article gets its own
entrance.

The animation is disabled when `prefers-reduced-motion: reduce` is active.
Keep all page entrance motion covered by that preference.

### Token reference

| Token | Role |
|---|---|
| `--border-2` | Thumb color in all themes |
| `--bg` | Track base for page-level scrollbar only |
| `transparent` | Track background for all component-level scrollbars |

### Existing implementations

| Selector | File | Notes |
|---|---|---|
| `html, body` | `src/index.css` | Page scrollbar; semi-opaque track |
| `.save-data-panel` | `src/index.css` | Modal panel; transparent track |
| `.ie-settings-modal` | `src/index.css` | Settings modal; transparent track |
| `.timezone-config-modal-scroll` | `src/index.css` | Timezone modal inner scroll area |
| `.forecast-day-strip` | `src/index.css` | Horizontal day strip; 8px height |

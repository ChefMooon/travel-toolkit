# Style Guide

Companion to [SITE-DESIGN-SPEC.md](./SITE-DESIGN-SPEC.md). This document covers recurring CSS patterns that must be applied consistently across the codebase. When SITE-DESIGN-SPEC and this document conflict, prefer SITE-DESIGN-SPEC.

---

## Home page tool cards

Tools are shown as postcards carrying a postage stamp. Rule: **stamps mean
tools.** The perforated stamp is reserved for tool identity (home cards, the
tools popover, the Trip Cost toolbar pill) and is not used as general
decoration.

### Tool color

Each tool has a distinct accent inspired by the trip-cost group palette. The
complete named palette lives in [`COUPLE_COLORS`](../src/store/types.ts); the
first five Pressed Flowers colors also have CSS tokens near the top of
[`src/index.css`](../src/index.css). The card shades are contrast-adjusted
derivatives, not exact copies. Choose a recognizable palette hue that is
distinct from the existing tools, then tune it separately for each theme.

| Tool | Palette inspiration | `data-tool` |
|---|---|---|
| Trip Cost | Rose | `trip` (also the default) |
| Currency Converter | Sage | `currency` |
| Timezone Tracker | Periwinkle | `timezone` |
| Destination Forecast | Tan, adjusted toward amber | `forecast` |
| Unit Converter | Plum | `units` |
| Travel Countdown | Teal | `countdown` |

The tool list is defined in [`src/lib/tools.ts`](../src/lib/tools.ts). Color is
applied through the `[data-tool]` attribute hook, set to the route name
(`tool.route.slice(1)`). Any element with `data-tool` (card, popover row,
toolbar pill, the navbar trigger for the current tool) receives these
variables, with light and dark values in the `[data-tool]` block of
`src/index.css`:

`--card-edge`, `--card-icon`, `--card-icon-bg`

This block is the only place tool colors are defined; component rules such as
`.tool-card` only read the variables. Keep colors tied to the tool route, not
its grid position. When adding a tool, define light and dark values for all
three variables under its `data-tool` value.

Check contrast in both themes against the actual adjacent colors: the resting
edge must reach at least 3:1 against the page background, the icon must remain
distinguishable from its stamp fill, and the focus outline must be visible.
Palette colors are starting points, not a guarantee; adjust the shades as needed.

### Postcard card

`.tool-card` uses `--card-paper` as its surface, a 1.5px solid `--card-edge`
border, 12px radius, and an inset 5px dashed frame (`::after`, 30% of the edge
color). The card has a stamp on top, then the label and description. Hover
deepens the shadow and, when motion is allowed, lifts the card 2px. The border
stays static. Keep the separate `:focus-visible` outline in `--card-edge`.
Settings and tools panels use `--card-paper` with a `--rule` border but no
dashed inner frame.

### ToolStamp

[`ToolStamp`](../src/components/ToolStamp/ToolStamp.tsx) is the single
component for tool icons. Do not hand-roll stamp markup.

- Props: `icon` (Lucide component) and `size`: `card` (42px, default), `row`
  (30px, popover rows), `mini` (26px, Trip Cost pill). Sizing is driven by
  `--s`, `--step`, `--hole`, `--pad`, and `--pm-w` on `.stamp-wrap--{size}`.
- Decorative: the wrapper is `aria-hidden="true"`; the adjacent text label
  carries the name.
- Perforation: `.stamp` fills with `--card-icon-bg` and is cut with four
  radial-gradient masks (one per edge) combined by intersection. Declare both
  `-webkit-mask` / `-webkit-mask-composite: source-in` and the standard
  `mask` / `mask-composite: intersect`. An `@supports not (...)` fallback
  removes the mask and uses a plain 10px radius.
- Postmark: an SVG overlay, hidden at rest. On card hover or `:focus-visible`
  it appears (about 0.6 opacity) with a short stamp-in animation, and the stamp
  tilts -4deg. The current popover row shows its postmark at 0.7.
- Reduced motion: no transitions, tilt or animation; the postmark simply appears
  at its final state on hover and focus.
- Forced colors: the mask and fill are dropped for a `CanvasText` 1px border on
  `Canvas`, and the postmark and card dashed frame are hidden.

## Paper background

The page background is `--bg` plus a tiled grain image (`grain-light.svg` or
`grain-dark.svg`, 200px tile) set on `html` only, with `data-theme="dark"`
selecting the dark variant. Do not use `background-attachment: fixed`, because
it forces repaints on scroll and is unreliable on mobile; the grain scrolls
with the page. Do not repeat the grain on `body` or on components.

## Header translucency

The navbar and the Trip Cost mobile nav are translucent over the paper: 80%
`--bg` for the navbar and 94% for the mobile nav. The tint and
`backdrop-filter: blur(10px)` (with the `-webkit-` prefix) live on a `::before`
pseudo-element, with `isolation: isolate` on the host.

Never put `backdrop-filter` (or `filter`, `transform`) on an element that
contains `position: fixed` children. It makes that element the containing block
for them. The navbar holds the tools popover and its fixed full-screen
backdrop, so blurring `.navbar` itself would shrink the backdrop to the
header's box.

Fallbacks: `@supports not (backdrop-filter...)` makes the `::before` solid
`--bg`, and `prefers-reduced-transparency: reduce` does the same and removes
the blur.

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

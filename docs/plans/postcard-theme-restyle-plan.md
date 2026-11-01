# Postcard Theme Restyle — Implementation Plan

## Overview

Give the app a light travel theme without taking focus away from the tools. Tool icons become perforated postage stamps, landing cards become light postcards, the hero gets a flight-path accent, and the app background becomes a warm paper tone with faint grain. The tool navigation popover becomes a simple list so it scales as more tools are added. The header, logo, favicons, settings panel, Trip Cost toolbar and mobile nav are retinted to match, and the shared neutral tokens are tuned so existing tool pages sit well on the new background.

Guiding rule: **stamps mean tools.** Anything that takes you to (or belongs to) a tool gets a stamp. App controls only pick up the new paper tokens.

Ships as **one release** so the style is consistent everywhere from the start, built as a sequence of PRs (section 14).

Reviewed adversarially on 2026-11-01; corrections and additions from that review are folded in below, and the decisions it raised are recorded in section 15.

Mockup used to choose these options: https://claude.ai/artifact/YXBgsjD9St18hZHfpGYvyD (private; variant **B · Light postcard**, background **1 + 2**, header **Updated**, logo **Stamp**).

---

## 1. Decisions

| Area | Decision |
|---|---|
| Tool cards | **B · Light postcard**: warmer card surface, 1.5px tool-color border, faint dashed inner frame, stamp icon, postmark on hover/focus |
| Hero | Flight-path accent (dashed arc + plane) behind the title; **drop** the "Calculate trip cost" CTA; new subtitle |
| Subtitle | "Everything you need to plan the trip, in one place." |
| Background | Paper tone + faint grain across the **whole app** (replaces the dot grid); dotted world map behind the landing hero only |
| Map on mobile | Hidden below about 600px |
| Popover | Simple list: small stamp + label per row; the current tool gets a tinted row, a postmark and a "Here" label |
| Header | Translucent paper with backdrop blur and a warm hairline |
| Header buttons | Neutral paper tokens. While open, the tools button takes the current tool's color and the settings button takes the accent |
| Logo | "TT" becomes a perforated stamp with a thin rose outline; favicons and app icons regenerated to match |
| Settings panel | Paper surface and warm border; no stamps, postmarks, grain or inner frame |
| Trip Cost toolbar | Non-sticky solid paper band; trip name shows the Trip Cost stamp; Trip ID styled as a ticket stub |
| Browser theme color | Paper, with light and dark variants |
| Mobile bottom nav | Same treatment as the header |
| Tool pages | No redesign; token-level fixes only (section 8) |
| Release | One release |

---

## 2. Shared Pieces

### 2.1 Tokens (`src/index.css`)

- Retint `--bg` to a warm paper tone in light and dark (mockup: light `#F7F3EA`, dark `#1A1918`).
- Grain:
  - Put the grain layer on `html` only (with `var(--bg)`), and make `body` transparent. Today both `html, body` set a background (`index.css:75-77`), so a grain layer on both would paint twice.
  - Use a small pre-rendered WebP/PNG noise tile per theme (light and dark), not an feTurbulence SVG data URI, which re-renders on zoom.
  - Keep the grain at about 3% visible opacity or less, and test text contrast against the darkest grain pixel.
  - Do **not** use `background-attachment: fixed` (ignored on iOS, costly to repaint).
  - Remove the `body::before` dot-grid overlay, and the dead `body::before` selectors in the theme-preload and theme-switching rules (`index.css:119`, `:128`).
- Add `--card-paper` (mockup: light `#FFFDF8`, dark `#211F23`).
- Add header/control tokens: `--rule`, `--rule-2` (warm borders), `--btn` (paper control fill), `--stamp-paper` (mockup values: light `#E4DCCB` / `#D3CABA` / `#FBF8F1` / `#FFFDF8`; dark `#36322F` / `#47423F` / `#222024` / `#E6DED0`).
- `--accent-soft` **already exists** (`index.css:12`, dark `:63`) and 7 rules use it (lines 3724, 4370, 4452, 4482, 5636, 5910 and the date-picker selected day at 6478). Reuse it as is for the settings button's open state; don't redefine it.
- Text tokens: darken `--text-3` to about `#68635B` and `--text-2` to about `#5E5A53` (see 8.1).
- Shift `--bg-2`, `--bg-3`, `--border`, `--border-2` slightly warmer (see 8.2).
- Tool color scoping: the per-tool `--card-*` variables only exist under `.tool-card--*` classes (GridPanel rows already reuse those classes; units and countdown live far away at `index.css:6489-6492`). Add one scoping hook, `[data-tool="trip"]` etc. (or `.tool-tone--*`), with light and dark values and rose defaults, and put it on cards, popover rows, the Navbar tools trigger and the toolbar stamp. Move all six tools' values together.

### 2.2 `ToolStamp` component

A shared component used by the landing page, the popover and the Trip Cost toolbar:

- Markup: `.stamp-wrap > .stamp > .stamp-inner > icon`, plus the `.postmark` SVG. The whole thing is `aria-hidden`.
- `.stamp` uses a four-layer radial-gradient mask for the perforated edges. Size, hole spacing and hole radius are CSS variables (`--s`, `--step`, `--hole`) so each use can size it.
- There is no autoprefixer (`vite.config.ts`, `package.json`), so write the `-webkit-mask` / `-webkit-mask-composite: source-in` versions by hand next to `mask` / `mask-composite: intersect`.
- Fallback: `@supports not ((mask-composite: intersect) or (-webkit-mask-composite: source-in))` shows a plain rounded tile (today's look).
- Shadows go on `.stamp-wrap` with `filter: drop-shadow`, never on the masked element, because the mask clips them.
- `.postmark` is a ring plus wavy cancellation lines, stroked in the tool's edge color, hidden by default (`opacity: 0`).
- The logo does **not** use this mask; it is an SVG (section 5.2).

---

## 3. Landing Page (`src/routes/index.tsx`)

- Remove the CTA `Link`. Keep the `ArrowRight` import: "View all posts" still uses it (`index.tsx:57`).
- Hero title gets a dashed route `<path>`, an origin dot and a Lucide `Plane` at the end. All decorative and `aria-hidden`. Size and anchor the arc to the title's box so it still fits the longer French title.
- Add a dotted world map behind the hero: a static, pre-generated `public/world-dots.svg` (from Natural Earth land data, public domain), shown as `<img alt="">` or a CSS background, not about 700 inline JSX nodes. Fade it out with a mask before it reaches the cards, and hide it below about 600px.
- Swap `.tool-launcher-icon` for `ToolStamp`.
- Cards: `--card-paper` surface, 1.5px border, 12px radius, dashed inner frame (`::after`).
- Hover and focus-visible: the stamp tilts slightly and the postmark lands (scale/rotate in). Focus gets the same postmark as hover.

---

## 4. Navigation Popover (`src/components/GridPanel/GridPanel.tsx`)

- Change the panel to a `<ul>` list: one row per tool with a 30px `ToolStamp` and the label.
- The current tool is shown with a tinted row, a visible postmark and a "Here" label.
  - The installed TanStack Router (v1.168.1) already sets `aria-current="page"` on the active `Link`. Style from that attribute.
  - Use Link's render-prop children (`{({ isActive }) => …}`) to show the "Here" label, rather than `useLocation`, so the existing router mocks keep working.
  - Mark the "Here" text `aria-hidden="true"`. Otherwise it changes the link's accessible name to "Trip Cost Here", which repeats `aria-current` and breaks `getByRole('link', { name: 'Trip Cost' })`.
- Hover gets a `--surface-2` tint; focus-visible gets an inset outline in the tool color.
- A long list scrolls inside the popover. `max-height` / `overflow-y` already exist at ≤479px (`index.css:773-778`); extend them to all widths.
- Panel surface: `--card-paper` with a `--rule` border.
- Keep the existing focus trap, Escape handling and backdrop unchanged.
- Remove the old `.grid-panel-item` card styles.

---

## 5. Header, Logo and Favicons

### 5.1 Header (`src/components/Navbar/Navbar.tsx`, `.navbar` styles)

- **Critical: blur must not go on `.navbar` itself.** GridPanel renders inside `<header className="navbar">` (`Navbar.tsx:44`), and its backdrop is `position: fixed; inset: 0` (`index.css:258`). A `backdrop-filter` (or `filter`) on the header makes it the containing block for fixed children, so the dimmer would only cover the 58px header and click-outside would stop closing the popover. Put the translucent fill and blur on `.navbar::before { position: absolute; inset: 0; z-index: -1 }` instead, or portal the backdrop.
- Background: `color-mix(in srgb, var(--bg) 80%, transparent)` with `backdrop-filter: blur(10px)` (on the pseudo-element); bottom border `--rule`.
- Fallbacks: `@supports not (backdrop-filter: blur(1px))` and `@media (prefers-reduced-transparency: reduce)` make the header solid `--bg`.
- `.navbar` currently has `box-shadow: var(--shadow-sm)`: drop it in favor of the hairline.
- Both header buttons use `.grid-nav-trigger` (settings too: `SettingsMenu.tsx:45`), and `.grid-nav-trigger[aria-expanded="true"]` / `:hover` (`index.css:209-221`) style both. Give them `--btn` fill and `--rule-2` border, then split the open state with separate selectors (e.g. `.navbar-actions > .grid-nav-trigger` vs `.settings-menu > .grid-nav-trigger`):
  - Tools button: the current tool's colors through the `[data-tool]` hook (2.1); rose defaults on non-tool routes such as home and blog.
  - Settings button: the existing `--accent` / `--accent-soft`.
- `Navbar.test.tsx:9-17` uses the real router with no provider, so getting the current route in Navbar needs the test to add a router or mock it.
- `src/components/Topbar/Topbar.tsx` is not rendered anywhere (only `responsive.test.tsx:18` mocks it). Leave it out of scope; remove it in a separate cleanup.

### 5.2 Logo (`src/components/Logo/Logo.tsx`)

- Replace the raster `travel-toolkit-logo-100.webp` with an inline SVG of the stamp logo, sharing its geometry with `favicon.svg`: brand gradient (`#f4777c` → `#a76273`), white "TT", thin white inner frame, perforated paper edge drawn as one path.
- Edge contrast: paper edge `--stamp-paper`, a thin rose stroke (`rgba(90,40,48,.55)`, about 0.6px) on the perforated path, and a soft `filter: drop-shadow` on the wrapper. The stroke is what keeps the edge visible on light backgrounds.

### 5.3 Favicons and app icons (`public/`)

- `favicon.svg`: stamp logo drawn as one perforated path with a thin rose stroke (not a CSS shadow). Fixed colors, independent of the site theme: paper edge `#FFF8F4`.
- 16px rendering: perforations become noise at this size. Either add a simplified 16px variant (flat gradient square with a paper edge and hairline) or confirm the SVG reads acceptably at 16px in Chrome, Firefox and Safari.
- Regenerate `travel-toolkit-192x192.png` and `travel-toolkit-512x512.png` from the new SVG with `purpose: "any"`.
- Both current icons are marked `"any maskable"` (`manifest.json:12-22`). Launcher masks would cut off the perforated edge, so add separate full-bleed maskable PNGs (gradient + "TT" only, inside the safe zone) with `purpose: "maskable"`.
- Add an `apple-touch-icon` (180px, full stamp on a paper square) to `index.html`; there is none today.
- `manifest.json:9` `background_color: #FAFAF7` → the paper color.
- `theme-color` (`index.html:8`): paper color with light and dark `media` variants; manifest `theme_color` uses the light paper value (decision 15.1).
- Check light and dark browser tab bars.

---

## 6. Settings Panel (`src/components/SettingsMenu/SettingsMenu.tsx`, `.global-settings-panel`)

- Surface `--card-paper`, border `--rule`; selects and the theme segmented control use `--btn` / `--rule-2`.
- No stamps, postmarks or grain.
- No dashed inner frame (decision 15.4).

---

## 7. Trip Cost Toolbar and Mobile Nav

### 7.1 Trip Cost toolbar (`src/components/TripToolbar/TripToolbar.tsx`)

- `.trip-toolbar` (`index.css:353`) is **not** sticky; only `.navbar` is. Blur over scrolled content therefore does nothing here.
  - Decided (15.2): it stays non-sticky, as a solid `--bg` band with a `--rule` bottom border, so it reads as one unit with the header at the top of the page.
- Trip name pill, Trip ID chip, undo/redo, Markup, New Trip and save buttons use `--btn` / `--rule-2`.
- Include the `.trip-countdown-strip` between the toolbar and the page (`index.css:6504`, `TripCostPage.tsx:65`): check it against the new tokens.
- Trip name pill shows a small (about 26px) Trip Cost `ToolStamp` on the left.
- Trip ID chip reads like a ticket stub: label tinted with the Trip Cost icon background, dashed divider before the number.
- Check the toolbar's wrapped layout at tablet and phone widths.

### 7.2 Mobile bottom nav (fixed bar around `src/index.css` line 4971)

- Same treatment as the header (pseudo-element blur, `--rule` top border), but at **≥92% opacity**. It sits over busy trip content and inactive tabs use `--text-3` (`index.css:4995`), so contrast can't depend on what scrolls underneath.
- Same `@supports` / `prefers-reduced-transparency` fallbacks as the header. Keep its safe-area padding.

---

## 8. Tool Pages (token-level fixes only)

Reviewed in the running app with the paper background and grain injected (Currency, Forecast, Timezone; light and dark). Cards, section headers and inputs all use tokens and look correct; white cards separate slightly better from the paper. No per-page redesign needed.

### 8.1 `--text-3` contrast (required)

Muted text that sits directly on the page background (for example "Select a destination to load climate data", "No timezones tracked yet") uses `--text-3`.

| Token | On current `#FAFAF7` | On paper `#F7F3EA` |
|---|---|---|
| `--text-2` `#6B6860` | 5.32 | 5.02 |
| `--text-3` `#767169` | 4.63 | **4.37 (fails AA)** |
`--text-3` is also used on tinted fills, where the first proposal (`#6F6A62`) still fails or nearly fails:

| `--text-3` candidate | paper `#F7F3EA` | `--bg-2` `#F3F2EE` | `--bg-3` `#EAEAE4` | `--c1-soft` `#F2E4E5` | `--c3-soft` `#E8EAF6` | `--card-paper` `#FFFDF8` |
|---|---|---|---|---|---|---|
| `#6F6A62` | 4.85 | 4.79 | 4.44 | 4.34 | 4.48 | 5.28 |
| **`#68635B` (chosen)** | 5.38 | 5.32 | 4.93 | 4.82 | 4.97 | 5.86 |

- `--text-3` → `#68635B`. Warming `--bg-2` / `--bg-3` (8.2) lowers these numbers slightly, so recompute after that change.
- `#68635B` is close to the current `--text-2` (`#6B6860`), so `--text-2` darkens to about `#5E5A53` (6.19 on paper) to keep the two levels distinct (decision 15.3).
- **Required check, not optional:** ≥4.5:1 for `--text-3` on `--bg`, `--bg-2`, `--bg-3`, `--card-paper` and every `--c*-soft`, in both themes.

Dark theme values stay above 6:1 and need no change.

### 8.2 Warm neutrals (recommended)

`--bg-2`, `--bg-3`, `--border`, `--border-2` are slightly cool greys used in about 230 places (input fills, card header strips, chips, dividers). Shift them slightly warmer so they sit in the same palette as the paper. Keep `--surface` pure white so cards stay crisp. Recheck `--text-3` on `--bg-2` after the change.

### 8.3 Trip edit inputs

`.ef-select` and `.ef-inp` use `var(--bg)` as their fill, so they would turn paper-colored inside white cards. Switch them to the same fill as other inputs (`--bg-2` or `--surface-2`).

### 8.4 Text drawn in `--bg`

`.save-data-io-export-btn` uses `color: var(--bg)` (`index.css:5486`), so its text turns paper-colored. Check it still reads; switch to `--surface` or white if not.

### 8.5 Not affected

Colored group cards on the trip page (own tints), modals (solid surface over a dimmed backdrop), toasts and tooltips (`--surface`).

---

## 9. i18n (`src/i18n.ts`, `src/i18n/locales/fr-CA.ts`)

The only locales are en and fr-CA, and `check-i18n-catalogs.mjs` (lines 6-7) checks that their keys match. The French catalog uses the typographic apostrophe (’).

- `homeIntro`:
  - en: `Everything you need to plan the trip, in one place.`
  - fr-CA (draft): `Tout ce qu’il faut pour planifier le voyage, au même endroit.` (no « » quotes in the string)
- Remove `calculateTripCost` if nothing else uses it.
- Add a key for the popover's "Here" label (fr-CA draft: `Ici`).
- Run `npm run i18n:check`.

---

## 10. Accessibility and Theming Checklist

- [ ] Map, route, plane, stamps, postmarks and the stamp logo are `aria-hidden` (the brand link keeps its accessible name).
- [ ] `--text-3` meets 4.5:1 on the paper background; check `--text-2`, `--text-3` and the `--c*-soft` fills on tool pages in both themes.
- [ ] Every new color is a token with a dark value, including the grain, postmark and header tokens. Favicon colors are intentionally fixed.
- [ ] Transforms and transitions only under `prefers-reduced-motion: no-preference`.
- [ ] `forced-colors: active` drops the masks, postmarks, route, map and inner frames and keeps plain bordered cards; the current popover row uses `Highlight`.
- [ ] Hover and focus-visible get the same postmark treatment.
- [ ] Header and mobile nav text stays readable over scrolled content through the blur (check a busy trip page); solid fallbacks work with `prefers-reduced-transparency` and without `backdrop-filter` support.
- [ ] Stamps fall back to plain rounded tiles where mask compositing is unsupported.
- [ ] The popover's "Here" label is `aria-hidden`; the active link is announced through `aria-current`.

---

## 11. Tests

- `src/routes/index.test.tsx`: remove the CTA assertion (`:61`) and the `.tool-launcher-icon` assertions (`:69-77`); assert the new subtitle, the stamp markup, and that the decoration is `aria-hidden`.
- `src/components/GridPanel/GridPanel.test.tsx`: the `.tool-launcher-icon` assertions (`:43-50`) change with the list markup. Its router mock (`:8-14`) only provides `Link` and never sets `aria-current`, so extend the mock (render-prop children with `isActive`) and add a test that the current tool is marked (`aria-current="page"`, "Here" label hidden from the accessible name).
- `src/components/Navbar/Navbar.test.tsx` (`:9-17`, real router without a provider): add a router or mock for the route-aware trigger color.
- `SettingsMenu.test.tsx`, `TripToolbar.test.tsx`: update for markup changes (stamp in the trip name).
- Run `npm run i18n:check` and `tsc -b` as well as the test suite.

---

## 12. Docs

- `docs/STYLE-GUIDE.md`: rewrite the "Home page tool cards" section for the postcard/stamp treatment, the shared `ToolStamp`, and the "stamps mean tools" rule.
- `docs/SITE-DESIGN-SPEC.md`: update the background token and "subtle dotted background" line, the `--text-3` / `--text-2` and neutral token values (its `--text-3` values at line 60 are already out of date), the landing launcher and grid launcher sections (list popover), and the header/grid launcher button styling. Add a version-history row.
- `CHANGELOG.md` entry and the release blog post, per `.github/copilot-instructions.md`.

---

## 13. Verification

- Light and dark on the landing page and every tool page, at desktop and phone widths, including the Trip Cost page with groups and costs filled in.
- Keyboard: tab through the cards (postmark on focus), open the popover, check the current tool marker, Escape returns focus to the trigger; same for the settings panel.
- With the new header: the popover backdrop dims the whole page, and clicking anywhere on the page closes the popover.
- Favicon in light and dark browser tab bars; installed PWA icon.
- Reduced motion and forced colors emulation.
- Run the test suite, `npm run i18n:check` and `tsc -b`.

---

## 14. Work Order

One release, built as ordered PRs so each step can be reviewed and checked on its own:

1. **Tokens and background:** paper `--bg`, grain on `html`, removal of the dot grid, `--text-3` (and `--text-2`) contrast fix, warmer neutrals, `.ef-*` inputs, the `[data-tool]` scoping hook.
2. **ToolStamp and landing page:** stamp component with fallbacks, postcard cards, hero, world map.
3. **Popover and header:** list popover, pseudo-element header blur (with the backdrop check), trigger button states, settings panel.
4. **Trip Cost toolbar and mobile nav.**
5. **Logo, icons and manifest:** stamp logo SVG, favicon, PWA and maskable icons, apple-touch-icon, manifest colors, theme-color.
6. **Docs and release:** style guide, design spec, changelog, blog post.

---

## 15. Review Decisions (decided 2026-11-01)

1. **Browser theme color:** switch from rose `#C4737A` to the paper color, with light and dark `<meta name="theme-color" media="(prefers-color-scheme: …)">` variants (`index.html:8`). Manifest `theme_color` uses the light paper value.
2. **Trip Cost toolbar:** stays non-sticky; a solid paper band with a `--rule` border, no blur.
3. **`--text-2`:** darken to about `#5E5A53` so it stays visibly stronger than the new `--text-3` (`#68635B`).
4. **Panel inner frame:** none. The settings and tools panels stay plain.

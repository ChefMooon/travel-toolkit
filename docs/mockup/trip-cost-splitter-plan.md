# Trip Cost Splitter — Design Spec & Implementation Plan
**Project:** `maddis-kensington-tools` (GitHub repo)
**Stack:** TanStack Start · Cloudflare Pages · TypeScript · Tailwind CSS v4
**Version:** 1.0 | March 2026

---

## Part 1 — Design Specification

### 1.1 Concept: "Vacation Vibes"

Elegant and playful at once — a "Pressed Flowers" pastel palette of dusty rose, sage green, periwinkle, warm peach, and dusty mauve. Desaturated enough to feel refined, saturated enough to be joyful and distinct. Each couple is auto-assigned one of these tones, threading their color through chip, row highlight, and summary card like a personalised luggage tag.

**One unforgettable thing:** The couple colors are muted pastels that feel like a curated travel mood board — soft but unmistakably intentional. In dark mode the same hues glow warmly against a near-black background.

**Title:** `MKT` — displayed in `Fraunces` italic with the last letter accented in coral.

---

### 1.2 Visual Identity

#### Color Palette (CSS variables)

**Couple accent palette — "Pressed Flowers"** (assigned round-robin):
```css
/* Dusty rose */
--c1: #C4737A;  --c1-mid: #D8979D;  --c1-soft: #F2E4E5;  --c1-border: #E8C4C7;
/* Sage green */
--c2: #6A8F7A;  --c2-mid: #8AAF9A;  --c2-soft: #E4EFE8;  --c2-border: #C0D8CA;
/* Periwinkle */
--c3: #7B87BE;  --c3-mid: #9AA5CF;  --c3-soft: #E8EAF6;  --c3-border: #C4CAE8;
/* Warm peach/tan */
--c4: #C49A6A;  --c4-mid: #D4B48A;  --c4-soft: #F5EDE0;  --c4-border: #E8D4B8;
/* Dusty mauve */
--c5: #9B7BB4;  --c5-mid: #B59CCA;  --c5-soft: #EDE8F4;  --c5-border: #D4C4E4;
```

**Semantic accents:**
```css
--accent:      #C4737A;  /* dusty rose — primary CTA, save button, brand */
--accent-soft: #F2E4E5;
--danger:      #B85C5C;  /* muted red — destructive actions */
--danger-soft: #FAEBEB;
--focus:       #7B87BE;  /* periwinkle — focus rings, bulk bar */
```

**Light mode** (`[data-theme="light"]` on `<html>`):
```css
--bg: #FAFAF7; --bg-2: #F3F2EE; --bg-3: #EAEAE4;
--surface: #FFFFFF; --surface-2: #F8F8F5;
--border: #E2E0D8; --border-2: #D0CEC4;
--text: #2A2824; --text-2: #6B6860; --text-3: #A8A59E;
```

**Dark mode** (`[data-theme="dark"]` on `<html>`):
```css
--bg: #18171A; --bg-2: #211F24; --bg-3: #2A2830;
--surface: #1E1C22; --surface-2: #252330;
--border: #322F3A; --border-2: #403D4C;
--text: #EEEAE6; --text-2: #9E9B96; --text-3: #625F5A;
/* --cN-soft/border use rgba at 13%/22% opacity */
```

**Background texture:** `body::before` dot-grid using `radial-gradient` with `--border` at 24px spacing, 0.5 opacity.
**Theme persistence:** `data-theme` stored in `localStorage` with all trip state, restored on load.

#### Typography
| Role | Font | Weight | Notes |
|---|---|---|---|
| Brand / Display | `Fraunces` (Google Fonts) | 700 italic | Logo, wordmark "MKT", modal titles |
| Body / UI | `Nunito` (Google Fonts) | 400/600/700/800 | All labels, buttons, chips |
| **All numbers** | `JetBrains Mono` (Google Fonts) | 400/600 | Every currency value, amount, total |

Google Fonts import:
```
Nunito:wght@400;500;600;700;800;900 + Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,700 + JetBrains+Mono:wght@400;600
```

#### Light/Dark Toggle
- Pill-shaped toggle in topbar right, knob springs with `cubic-bezier(0.34, 1.56, 0.64, 1)`
- `data-theme` on `<html>` drives all tokens via CSS variables
- All colors transition: `0.35s ease`

#### Iconography
Use `lucide-react` exclusively. Key icons:
- `GripVertical` — drag handle
- `Pencil` — edit inline
- `Trash2` — delete (red on hover)
- `Plus` — add cost, add couple
- `ChevronDown` — dropdowns
- `Sun` / `Moon` — theme toggle knob icons
- `Users` — couple
- `Baby` — non-paying traveller
- `RotateCcw` — start new trip
- `CheckSquare` — bulk select

---

### 1.3 Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR: Trip title (editable) · Global markup · New Trip   │
├────────────────────────────┬────────────────────────────────┤
│                            │                                │
│   LEFT PANEL (60%)         │   RIGHT PANEL (40%)            │
│                            │                                │
│  ┌──────────────────────┐  │  ┌──────────────────────────┐  │
│  │  GROUP SETUP         │  │  │  COST SUMMARY            │  │
│  │  (Couples + children)│  │  │  Per couple · by currency│  │
│  └──────────────────────┘  │  │  Exchange rate inputs    │  │
│                            │  │  USD totals              │  │
│  ┌──────────────────────┐  │  └──────────────────────────┘  │
│  │  COST LEDGER         │  │                                │
│  │  (sortable table)    │  │                                │
│  │  + Add Cost button   │  │                                │
│  └──────────────────────┘  │                                │
│                            │                                │
└────────────────────────────┴────────────────────────────────┘
```

On mobile (<768px): Panels stack vertically; Summary panel moves below Cost Ledger.

---

### 1.4 Component Designs

#### A. Topbar
- White/dark surface with 2px border-bottom
- Left: Rotated rounded logo square (coral bg, `Fraunces` italic "M") + wordmark "MKT" (last letter coral)
- Center: Editable trip name in a rounded pill with ✈️ emoji prefix
- Right: Global markup pill · sun/moon theme toggle · "↺ New Trip" button (ghost, turns red on hover)

#### B. Group Setup Panel
- Section header "Travelling Party" with "+ Add Couple" and "+ Add Child" buttons
- Each **couple** rendered as a solid pill chip in its assigned couple color: `[drag handle] [● dot] [Name — editable] [× remove]`
- Couples auto-named "Couple 1", "Couple 2" etc — click name to rename inline
- **Children are visually linked to a couple.** Each child is assigned to a couple when added. The child chip uses the same couple color but with a *dashed* border and 85% opacity to signal it is a dependent traveller, not a payer. Children are indented below their couple with a dashed connector line (`::before` pseudo-element on `.couple-group-children`).
- Layout: `.couple-group` column → `.couple-group-row` (the couple chip) → `.couple-group-children` (indented, dashed-border child chips in same color)
- "+ Add Child" always prompts which couple the child belongs to before adding

#### C. Cost Ledger Table

**Table columns:**
| # | Column | Width | Notes |
|---|---|---|---|
| 1 | Drag | 32px | `GripVertical` icon, cursor grab |
| 2 | ☐ | 32px | Checkbox for bulk select |
| 3 | Name | flex | Editable inline on click |
| 4 | Currency | 80px | `<select class="cur-select">` — styled dropdown with 18 common currencies (EUR, USD, GBP, MXN, JPY, CAD, AUD, CHF, SGD, HKD, DKK, SEK, NOK, NZD, BRL, INR, THB, ZAR). Uses custom chevron arrow via `background-image` SVG, `appearance: none`. Also used in the edit row as `.ef-select` (larger variant). |
| 5 | Amount | 100px | Monospace number input |
| 6 | Markup | 90px | Shows `2.5% (g)` or `0% (c)` — click to override |
| 7 | Split | 100px | Badge: `Shared` / `Subset` / `Individual` |
| 8 | Assigned To | flex | Couple chips, shown for Subset/Individual |
| 9 | Total w/ Markup | 110px | Computed, monospace, muted gold |
| 10 | Actions | 64px | Edit · Delete |

- **Row states:** default (parchment-mid on even rows), hover (slight gold left border), selected (sage tint), editing (inline form expands row)
- **Bulk action bar** appears above table when rows are selected: "Assign currency → [dropdown] [Apply]"
- **Drag-and-drop** via `@dnd-kit/core` with visual placeholder row
- **Add Cost** button is a full-width dashed-border row at the bottom of the table, clicking opens an inline form as a new row

#### D. Inline Edit Row (Add/Edit Cost)
When adding or editing, the row expands to show a form with all fields:
- Name: text input
- Currency: searchable select
- Amount: number input
- Markup: number input with "use global" toggle
- Split type: segmented control (Shared · Subset · Individual)
- If Subset: checkbox list of couples
- If Individual: radio list of couples
- Save / Cancel actions

#### E. Cost Summary Panel (Right)

**Per-couple card layout:**
```
┌─────────────────────────────┐
│ ✦ Couple 1                  │
│─────────────────────────────│
│ EUR                         │
│   Shared        €142.50     │
│   Subset         €40.00     │
│   Individual      €0.00     │
│   Subtotal      €182.50     │
│   Rate: 1 EUR = [1.08] USD  │
│   = $197.10                 │
│─────────────────────────────│
│ MXN                         │
│   ...                       │
│─────────────────────────────│
│ TOTAL USD          $312.50  │
└─────────────────────────────┘
```
- All figures in `IBM Plex Mono`
- Exchange rate inputs styled as small inline fields
- Grand total row uses larger type, gold color
- Cards have parchment paper texture via subtle CSS noise pattern

#### F. Modals / Dialogs
- Delete confirmation: minimal centered modal, "Delete this cost?" with Cancel / Delete (rust) buttons
- Start New Trip: same pattern with stronger warning copy
- Backdrop: `rgba(28,25,23,0.5)` blur

---

### 1.5 Motion & Interaction

- Page load: staggered fade-up of the two panels (150ms delay between)
- Cost row add: slide-down + fade-in
- Cost row delete: slide-up + fade-out before removal
- Drag-and-drop: row lifts with subtle shadow + slight rotation (2deg)
- Summary cards: numbers animate via count-up when values change
- Markup badge: pops with a quick scale(1.1) pulse when value changes

---

## Part 2 — Technical Architecture

### 2.1 Stack
| Layer | Choice | Reason |
|---|---|---|
| Framework | TanStack Start (React) | Specified in requirements |
| Hosting | Cloudflare Pages | Specified in requirements |
| Styling | Tailwind CSS v4 | Co-pilot with custom CSS vars |
| State | Zustand | Lightweight, localStorage-friendly |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable` | Best React DnD for lists |
| Forms | Controlled React state (no form lib) | Keep it lean |
| Icons | `lucide-react` | Consistent, tree-shakeable |
| Fonts | Google Fonts (Fraunces, Nunito, JetBrains Mono) | Via `<link>` in document head |
| Persistence | `localStorage` via Zustand middleware | Auto-save on every state change |

### 2.2 File Structure
```
maddis-kensington-tools/
├── app/
│   ├── routes/
│   │   └── index.tsx            # Main app route (single page)
│   ├── components/
│   │   ├── Topbar.tsx
│   │   ├── GroupSetup.tsx
│   │   ├── CostLedger.tsx
│   │   │   ├── CostRow.tsx
│   │   │   ├── EditRow.tsx
│   │   │   └── BulkActionBar.tsx
│   │   ├── CostSummary.tsx
│   │   │   ├── CoupleCard.tsx
│   │   │   └── ExchangeRateInput.tsx
│   │   └── ui/
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       └── InlineEdit.tsx
│   ├── store/
│   │   ├── tripStore.ts         # Zustand store + localStorage middleware
│   │   └── types.ts             # All TypeScript types
│   ├── lib/
│   │   └── calculations.ts      # Pure cost-splitting calculation functions
│   ├── styles/
│   │   └── globals.css          # CSS variables, base styles, fonts
│   └── root.tsx
├── public/
├── wrangler.toml                # Cloudflare config
├── package.json
└── tsconfig.json
```

### 2.3 Core Types (`store/types.ts`)
```typescript
type SplitType = 'shared' | 'subset' | 'individual';

interface Couple {
  id: string;
  name: string;         // default "Couple N", editable
  sortOrder: number;
}

interface NonPayingTraveller {
  id: string;
  label: string;        // e.g. "Child 1"
}

interface CostEntry {
  id: string;
  name: string;
  currency: string;     // ISO 4217 code
  value: number;        // base amount, pre-markup
  markupOverride: number | null;  // null = use global
  splitType: SplitType;
  assignedCoupleIds: string[];    // subset or individual
  sortOrder: number;
}

interface ExchangeRate {
  currency: string;
  rateToUSD: number;
}

interface TripState {
  tripName: string;
  globalMarkup: number;           // percentage, e.g. 2.5
  couples: Couple[];
  nonPayingTravellers: NonPayingTraveller[];
  costs: CostEntry[];
  exchangeRates: ExchangeRate[];
  // actions...
}
```

### 2.4 Calculation Engine (`lib/calculations.ts`)
Pure functions, fully tested:
- `getEffectiveMarkup(cost, globalMarkup)` → number
- `getCostWithMarkup(cost, globalMarkup)` → number
- `splitCost(cost, couples, globalMarkup)` → `Map<coupleId, amount>`
- `buildSummary(state)` → `CouplesSummary[]` with per-currency breakdown
- `applyExchangeRates(summary, rates)` → USD totals
- `roundHalfUp(value, decimals)` + remainder redistribution to first couple

---

## Part 3 — Phased Implementation Plan (Parallelized)

> **For the orchestrator:** Each phase lists independent sub-tasks that can be assigned to separate subagents simultaneously. Dependencies are noted explicitly.

---

### Phase 0 — Repository & Project Bootstrap
*Goal: Working TanStack Start + Cloudflare skeleton that builds and deploys.*
**All tasks are sequential in this phase.**

| Task | Agent | Description |
|---|---|---|
| 0-A | Bootstrap Agent | `cd maddis-kensington-tools && npx create-tsrouter-app@latest . --template react --tailwind --typescript` (or equivalent TanStack Start init). Install deps: `zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react`. |
| 0-B | Bootstrap Agent | Create `wrangler.toml` for Cloudflare Pages. Set `pages_build_output_dir` to the build output folder. Add `build` script to `package.json`. |
| 0-C | Bootstrap Agent | Set up `app/styles/globals.css` with all CSS variables from §1.2, Google Fonts `<link>` tags in `root.tsx`, Tailwind config referencing custom colors. |
| 0-D | Bootstrap Agent | Create `app/store/types.ts` with all TypeScript interfaces from §2.3. Create empty `app/lib/calculations.ts` and `app/store/tripStore.ts` with placeholder Zustand store. |
| 0-E | Bootstrap Agent | Verify `npm run build` succeeds and produces a deployable output. Commit and push to `main`. |

---

### Phase 1 — Core Logic & State Layer
*Goal: All calculation logic and Zustand store fully implemented and unit-tested. No UI yet.*
**All Phase 1 tasks can run in parallel after Phase 0 completes.**

| Task | Agent | Description |
|---|---|---|
| 1-A | Logic Agent | Implement `app/lib/calculations.ts` fully: all pure functions listed in §2.4 including half-up rounding with remainder redistribution. Write inline test cases (or a `calculations.test.ts`) covering: shared split, subset split, individual assignment, 0% markup, single couple edge case, multi-currency grouping, rounding remainder. |
| 1-B | State Agent | Implement `app/store/tripStore.ts` using Zustand with `persist` middleware (localStorage). Implement all actions: addCouple, removeCouple, renameCouple, addNonPaying, removePaying, addCost, editCost, deleteCost, reorderCosts, setGlobalMarkup, setExchangeRate, resetTrip. Wire calculations from 1-A into derived selectors. |

---

### Phase 2 — UI Component Library
*Goal: All reusable UI primitives built and styled. No business logic wired yet.*
**All Phase 2 tasks can run in parallel after Phase 0 completes. (Can overlap with Phase 1.)**

| Task | Agent | Description |
|---|---|---|
| 2-A | UI Agent A | Build `app/components/ui/Modal.tsx`: accessible dialog with backdrop blur, animation, confirm/cancel slot. Build `app/components/ui/Button.tsx`: variants (primary/ghost/destructive/secondary), sizes. |
| 2-B | UI Agent B | Build `app/components/ui/Badge.tsx`: split-type badges (Shared=gold, Subset=sky, Individual=ink), markup badges showing `2.5% (g)` / `0% (c)` with visual distinction. Build `app/components/ui/InlineEdit.tsx`: click-to-edit text field with save on blur/enter, cancel on escape. |
| 2-C | UI Agent C | Build `app/components/Topbar.tsx`: logo, editable trip name (uses InlineEdit), global markup input, Start New Trip button wired to Modal. Style per §1.4-A. |

---

### Phase 3 — Feature Panels
*Goal: GroupSetup and CostSummary panels fully built and wired to store.*
**Depends on Phase 1 (store) + Phase 2 (UI components). Phase 3 tasks are parallel to each other.**

| Task | Agent | Description |
|---|---|---|
| 3-A | Feature Agent A | Build `app/components/GroupSetup.tsx`: couple chips with inline rename (InlineEdit), drag-to-reorder couples, remove couple button, add couple button (auto-names), add non-paying traveller, remove non-paying traveller. Wire all actions to Zustand store. |
| 3-B | Feature Agent B | Build `app/components/CostSummary/CoupleCard.tsx` and `ExchangeRateInput.tsx`. Build `app/components/CostSummary.tsx`: renders one CoupleCard per couple, shows per-currency breakdown (shared/subset/individual subtotals), exchange rate inputs per currency, USD equivalents, grand total. All numbers in IBM Plex Mono. Animate number changes with a count-up effect. Wire to store selectors from Phase 1-B. |

---

### Phase 4 — Cost Ledger (Most Complex Feature)
*Goal: Full cost entry table with all interactions.*
**Depends on Phase 1 + Phase 2 + Phase 3-A (need couples list). This phase is the most complex; split into parallel sub-tasks.**

| Task | Agent | Description |
|---|---|---|
| 4-A | Ledger Agent A | Build `app/components/CostLedger/CostRow.tsx`: read-only row displaying all columns from §1.4-C. Implement markup badge display logic (global vs custom). Implement the computed "Total w/ Markup" column. Wire edit/delete action buttons (delete triggers Modal confirmation). |
| 4-B | Ledger Agent B | Build `app/components/CostLedger/EditRow.tsx`: the inline add/edit form row. All fields: name, currency (searchable select with common currencies pre-listed), amount, markup override toggle + input, split type segmented control, couple assignment (checkbox for subset, radio for individual). Form validation (required fields). Save wires to store addCost/editCost. |
| 4-C | Ledger Agent C | Build `app/components/CostLedger/BulkActionBar.tsx`: appears when ≥1 rows selected, shows count, bulk currency dropdown + Apply button. Build select-all checkbox logic. Wire bulk currency update to store. |
| 4-D | Ledger Agent D | Build `app/components/CostLedger.tsx` (parent): integrates `@dnd-kit/sortable` for drag-and-drop row reordering. Compose CostRow, EditRow, BulkActionBar. Handle row selection state. "Add Cost" dashed-row at bottom. Wire `reorderCosts` store action on drag end. |

---

### Phase 5 — Integration, Polish & Deployment
*Goal: Assemble all components, apply animations, fix edge cases, deploy.*
**Depends on all Phase 4 tasks completing. Tasks 5-A and 5-B can run in parallel.**

| Task | Agent | Description |
|---|---|---|
| 5-A | Integration Agent | Assemble `app/routes/index.tsx`: compose Topbar + two-panel layout (GroupSetup + CostLedger left, CostSummary right). Implement responsive stacking for mobile. Test all edge cases from PRD §10: single couple, zero markup, subset-of-one, renaming couples, mixed currencies. Verify localStorage restore on page reload. Verify Start New Trip reset clears all data. |
| 5-B | Polish Agent | Apply all motion/animation from §1.5: staggered panel load, row add/delete animations, drag lift effect, markup badge pulse, number count-up in summary. Add paper-texture CSS background to summary cards. Fine-tune spacing, font sizes, color application throughout. Ensure all monospace numbers are correctly typeset. |
| 5-C | Deploy Agent (sequential after 5-A+5-B) | Run `npm run build`. Verify build output. Deploy to Cloudflare Pages via `wrangler pages deploy`. Smoke test the live URL: add couples, add costs in multiple currencies, verify splits, verify localStorage persistence across reload, test Start New Trip reset. |

---

## Part 4 — Agent Instructions Summary

### Conventions all agents must follow
1. **All monetary values** displayed in `font-family: 'IBM Plex Mono'` — apply via a `.mono-num` CSS class.
2. **CSS variables only** for colors — no hardcoded hex values in component files.
3. **No `localStorage` calls outside `tripStore.ts`** — all persistence goes through Zustand persist middleware.
4. **Pure functions only in `calculations.ts`** — no store imports, no side effects.
5. **Confirmation modal before any destructive action** (delete cost, remove couple, start new trip).
6. **Markup always visible** on every cost row — never hidden. This is a hard PRD requirement (FR-06).
7. **Half-up rounding** per §8.4 — use the `roundHalfUp` utility, never `Math.round`.
8. **Currency buckets never mixed** — calculations always group by currency code before summing.
9. All components are **default exports**, all types are in `store/types.ts`.
10. Commit after each completed phase with message format: `feat(phase-N): description`.

---

## Part 5 — Parallelization Map

```
Phase 0 (sequential bootstrap)
    │
    ├─────────────────────────────┐
    │                             │
Phase 1-A (calculations)    Phase 1-B (store)       Phase 2-A (Modal+Button)
                                                     Phase 2-B (Badge+InlineEdit)
                                                     Phase 2-C (Topbar)
    │                             │                        │
    └──────────────┬──────────────┘────────────────────────┘
                   │
            Phase 3-A (GroupSetup)     Phase 3-B (CostSummary)
                   │                        │
                   └──────────┬─────────────┘
                              │
          Phase 4-A (CostRow)     Phase 4-B (EditRow)
          Phase 4-C (BulkAction)  Phase 4-D (CostLedger parent)
                              │
                    Phase 5-A (Integration)  Phase 5-B (Polish)
                              │
                         Phase 5-C (Deploy)
```

**Estimated parallel speedup:** 6 phases instead of ~14 sequential tasks.
**Critical path:** 0 → 1-B → 3-A → 4-D → 5-A → 5-C

---

*End of document. Total phases: 6. Total agent tasks: 20. Maximum parallel agents at once: 4 (Phase 4).*

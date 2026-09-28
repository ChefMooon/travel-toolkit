# Travel Toolkit Site Design Specification

## 1. Purpose

This document is the canonical design source of truth for the Travel Toolkit web application UI.

It defines:
- Visual language (color, typography, spacing, elevation, motion)
- Theme behavior (light and dark mode)
- Responsive layout and navigation rules
- Component behavior and interaction states
- Accessibility and error-state requirements for user-facing UI

For product scope and business rules, refer to [Travel Toolkit PRD.md](./Travel%20Toolkit%20PRD.md). For technical implementation details, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

## 2. Scope and Source Hierarchy

This spec applies to all user-facing surfaces in the app, including the shared route shell and routed pages:
- Global shell, top bar, and navigation controls
- Landing page tool launcher
- Trip Cost setup, ledger, and summary flows
- Currency, timezone, and forecast tool pages
- Modals, toasts, and mobile navigation

Source precedence for design decisions:
1. This document
2. Implemented design tokens and rules in [src/index.css](../src/index.css)
3. Component behavior in [src/components](../src/components)
4. Product constraints in [Travel Toolkit PRD.md](./Travel%20Toolkit%20PRD.md)

If implementation diverges from this document, update this document in the same change set as the UI update.

## 3. Product and UX Intent

The application helps travel groups split costs quickly without hidden calculations, and now also provides a tool-launcher home plus supporting travel tools. The design intent is:
- Trustworthy: users can always see markup, split mode, and allocation context
- Fast to edit: inline editing and one-screen workflows
- Calm but expressive: soft editorial palette, clear hierarchy, minimal clutter
- Mobile-first practical: complete task flow on small screens with no desktop-only actions

Terminology in current implementation uses Group and Child labels in several UI surfaces. This is acceptable as long as calculation behavior remains aligned to PRD paying-couple semantics.

## 4. Design Tokens

### 4.1 Core Semantic Tokens

Defined in [src/index.css](../src/index.css) under :root and theme selectors.

| Token | Light | Dark | Usage |
|---|---|---|---|
| --bg | #FAFAF7 | #18171A | App background |
| --bg-2 | #F3F2EE | #211F24 | Subtle raised surfaces |
| --bg-3 | #EAEAE4 | #2A2830 | Active/hover fill |
| --surface | #FFFFFF | #1E1C22 | Card and modal base |
| --surface-2 | #F8F8F5 | #252330 | Header and nested surfaces |
| --border | #E2E0D8 | #322F3A | Primary borders |
| --border-2 | #D0CEC4 | #403D4C | Secondary borders |
| --text | #2A2824 | #EEEAE6 | Primary text |
| --text-2 | #6B6860 | #9E9B96 | Secondary text |
| --text-3 | #A8A59E | #625F5A | Tertiary/label text |
| --accent | #C4737A | #C4737A | Primary action tone |
| --danger | #B85C5C | #B85C5C | Destructive actions |
| --focus | #7B87BE | #7B87BE | Keyboard focus ring |

Icon tone tokens (theme-aware, used for launcher and nav icons):

| Token | Light | Dark | Usage |
|---|---|---|---|
| --nav-icon-filter | sepia-based filter | invert/sepia-based filter | Top-bar grid launcher icon idle tone |
| --nav-icon-filter-hover | stronger sepia-based filter | brighter invert/sepia-based filter | Top-bar grid launcher icon hover/focus tone |
| --tool-icon-filter | sepia-based filter | invert/sepia-based filter | Landing and grid-panel tool icon idle tone |
| --tool-icon-filter-hover | stronger sepia-based filter | brighter invert/sepia-based filter | Landing and grid-panel tool icon hover/focus tone |

Theme-only semantic backgrounds:

| Token | Light | Dark | Usage |
|---|---|---|---|
| --markup-below | #FDE4E1 | #3D2626 | Markup warning state |
| --markup-equal | #FEF3D1 | #3D3A26 | Neutral/warning state |
| --markup-above | #E1F5E1 | #263D26 | Positive state |

### 4.2 Group Palette

Primary group colors (1-5) are implemented as CSS variables and soft/border variants. Additional selector colors (6-10) exist in [src/store/types.ts](../src/store/types.ts) for modal choice and theme-aware value mapping.

| Group | Light | Dark |
|---|---|---|
| 1 | #C4737A | #E89096 |
| 2 | #6A8F7A | #86B096 |
| 3 | #7B87BE | #98A8D9 |
| 4 | #C49A6A | #DFB885 |
| 5 | #9B7BB4 | #B89DCE |
| 6 | #44798A | #67AABC |
| 7 | #D8724C | #F4956D |
| 8 | #A8923E | #CCB85E |
| 9 | #2B4563 | #5A7DB8 |
| 10 | #8D627C | #B887A1 |

### 4.3 Typography

Loaded in [index.html](../index.html):
- Nunito: primary UI text
- Fraunces: modal/display headings
- JetBrains Mono: numeric and code-like values (currencies, totals, percentages)

Type roles:
- Card labels and metadata: uppercase, compact tracking, 10-11px
- Body interface text: 12-14px
- Numeric emphasis (totals/amounts): mono, 11-19px depending on hierarchy

### 4.4 Spacing, Radius, and Elevation

Spacing rhythm is compact and dense for data-entry speed:
- Primary interior padding: 12, 16, 20, 24
- Pill and chip controls: rounded 22px
- Card radius: 12-16px, modal radius: 16-20px

Elevation tokens:
- --shadow-sm: low elevation for sticky top bar and subtle hovers
- --shadow: default card depth
- --shadow-lg: modal/overlay depth

### 4.5 Motion

Motion is minimal and purposeful:
- Section load stagger: fadeUp animation with small delays
- Modal open: pop scale animation
- Toast entry: slide-down fade
- Hover transforms limited to tiny scale/translate shifts for affordance clarity

Animation should never block input and should remain under ~420ms for core UI transitions.

## 5. Theme System (Light and Dark)

### 5.1 Theme Behavior

Theme is controlled by data-theme on the html element.

Current behavior:
- Initial theme bootstraps before React mount via inline script in [index.html](../index.html), reading localStorage key travel-toolkit-trip-data
- Store theme state persists via Zustand in [src/store/tripStore.ts](../src/store/tripStore.ts)
- Toggling theme updates both store state and html[data-theme]
- Reset-trip keeps current theme, even while resetting trip data

### 5.2 Theme Control UX

The shared top bar includes a binary toggle:
- Light mode: default knob position
- Dark mode: knob translates to the right and control tint changes to group color 3

The toggle must always be visible in desktop and mobile top bar layouts on every route.

### 5.3 Theme Requirements for Future Changes

All new UI must:
- Use semantic CSS variables, not hardcoded colors
- Define readable text/background contrast in both themes
- Preserve focus visibility in both themes
- Avoid introducing light-only or dark-only component variants unless documented here

## 6. Responsive Design Specification

Breakpoints currently in use:
- Mobile: <= 479px
- Tablet: 480px-767px
- Desktop: >= 768px
- Large desktop composition: >= 1280px

Layout behavior:
- Landing page, currency, timezone, and forecast pages: single-column content flow on mobile and tablet, then compact stacked sections on desktop
- Trip Cost page: single-column content flow with persistent bottom tab navigation on mobile and tablet, single-column stacked sections on desktop, and a two-column layout with summary pinned to the right column on large desktop
- Global shell navigation is available on every route through the top bar grid launcher

Top bar behavior:
- <=479px: two-row top bar layout
- 480-767px: compact single-row
- >=768px: full single-row

Top-bar grid launcher sizing:
- Grid launcher trigger target is 48x48 to exceed the 44px minimum touch target
- Grid launcher glyph is 24x24 and uses theme-aware icon filter tokens

Ledger behavior:
- >700px: table layout
- <=700px: row-to-card transformation with 3-row internal grid

Touch requirements:
- Interactive controls target minimum 44px for touch contexts (hover:none rules)

## 7. Information Architecture and Flows

Primary screen structure on the Trip Cost page:
1. Top bar
2. Travelling party card (includes region selector above party card)
3. Cost ledger card
4. Cost summary card

Landing page structure:
1. Top bar
2. Tool launcher card grid

Tool page structure for currency, timezone, and forecast:
1. Top bar
2. Route-specific tool content

Mobile tab order on Trip Cost:
- Party
- Costs
- Summary

Core flows:
1. Configure trip metadata: set trip name, global markup, theme
2. Build travelling party: add groups, rename, reorder, set icon/color, add/remove children
3. Enter costs: create/edit/delete entries, assign split mode, apply markup override, set currency
4. Optimize bulk edits: multi-select ledger rows and bulk assign currency
5. Convert totals: enter exchange rates in summary cards and review USD totals
6. Start a new trip: review the active trip's save status, then save changes
   through Save Data Slots or start a new trip from its existing saved state

## 8. Component Behavior Specification

### 8.1 Top Bar

The shared top bar includes the logo, grid navigation button, and theme toggle.

On the Trip Cost page, the top bar also includes a page-scoped toolbar with editable trip name, editable global markup, and New Trip button.

States:
- Grid button: idle, open, and focus-visible states
- Theme toggle: binary light/dark state
- Trip name field on Trip Cost: idle, focus, clear-action visible when focused and non-empty
- Global markup on Trip Cost: display mode, inline input mode, validation fallback to prior value on invalid blur
- New Trip on Trip Cost: opens a decision showing whether the active trip is
  already saved, has changes since its last save, or has no saved slot

New Trip flow:
1. The decision identifies the active trip's save status:
   - If the active snapshot exactly matches a saved slot, the dialog names that
     slot and states there are no unsaved changes. **Save & Start New Trip** is
     hidden because another save is unnecessary; **Start New Trip** resets the
     active trip without replacing the existing saved copy. **Cancel** leaves
     the trip intact.
   - If the active snapshot differs from a saved version with the same trip ID,
     the dialog identifies the unsaved changes and last saved slot.
   - If no slot contains the active trip, the dialog states that it has not
     been saved and indicates when it has unsaved changes.
2. When a save is needed, **Save & Start New Trip** closes the decision modal
   and opens the existing Save Data Slots manager. The two dialogs are not
   shown together. **Start Fresh Without Saving** remains the explicit
   destructive choice.
3. Saving to an empty slot saves immediately. An occupied slot requires
   **Overwrite** and confirmation. Cancelling an overwrite or a rejected save
   leaves the active trip unchanged and the manager open.
4. After a successful save, the manager closes, the active trip resets, and one
   contextual **Saved and started new trip** success notification is shown.
5. Closing the manager without a successful save returns to the New Trip
   decision with the active trip intact. Closing the manager or cancelling that
   decision clears the one-shot continuation; saving and starting later
   requires choosing **Save & Start New Trip** again.
6. **Start Fresh Without Saving** resets only when explicitly selected and does
   not write to a save slot. The toolbar's ordinary **Save Data Slots** action
   opens the manager without a continuation; successful saves remain save-only.
7. Loading or successfully importing a trip in the manager cancels the pending
   continuation before replacing the active trip. If the current trip has
   unsaved changes, the existing replacement confirmation appears first. The
   manager stays open after replacement; later saves do not reset the
   replacement trip. Closing the manager returns to the New Trip decision,
   where a new continuation can be explicitly armed.

### 8.2 Grid Navigation Panel

The grid panel opens from the shared top bar and provides navigation to every route.

Behavior:
- Clicking the grid button toggles the panel open and closed
- Clicking outside closes the panel
- Navigating closes the panel
- On mobile it becomes a full-screen overlay
- On tablet and desktop it becomes an anchored dropdown panel
- Escape closes the panel
- The panel does not include a dedicated Close button; dismissal is via trigger toggle, backdrop, Escape, or route selection

Layout:
- Four destination tiles are presented in a 2x2 grid on anchored/tablet/desktop panel layouts
- Each tile stacks icon above label
- Labels support up to two lines for long names with balanced line-height and clipping
- Icon tones are theme-aware and intensify slightly on hover/focus for affordance clarity

Panel content:

| Icon | Label | Route |
|---|---|---|
| trip-cost.svg | Trip Cost | /trip |
| currency.svg | Currency | /currency |
| timezone.svg | Timezones | /timezone |
| forecast.svg | Forecast | /forecast |

### 8.3 Landing Page

The landing page is the default entry route and acts as a tool launcher.

Layout:
- Tool launcher content is centered within a constrained content width
- Tool cards use a responsive compact grid with centered card alignment
- Card width is intentionally narrower than full-row list sizing to preserve scanability

Each card includes:
- icon
- title
- short description (typically one to two lines)
- clear click target that navigates through the shared route system

### 8.4 Region Selector

Single-select dropdown controlling currency availability for entry and bulk actions.

Requirements:
- Must show all configured regions from store
- CAD and USD remain available as always-available currencies regardless of region

### 8.5 Travelling Party

Features:
- Add group
- Add child (disabled when no groups)
- Rename inline
- Reorder by drag handle
- Remove group with confirmation (also removes linked children)
- Edit icon and color via dedicated modals

Empty state appears when no groups exist.

### 8.6 Cost Ledger

Features:
- Sortable list (dnd-kit)
- Row select and bulk currency application
- Inline add row and edit row
- Split mode controls: All, Subset, Solo
- Split assignment modal for subset/solo assignment
- Delete confirmation modal

Markup behavior:
- Uses global markup by default
- Optional per-cost override with reset-to-global action

Validation on save (warning toast, no save):
- Missing name
- Invalid or negative amount
- Subset/Solo with no assignments

### 8.7 Split Assignment Modal

Modes:
- Subset: multi-select, requires at least one selection to confirm
- Solo: single-select, applies immediately

Behavioral rules:
- If subset/solo is closed with no assignments, split resets to shared
- Modal supports creating a new group inline and assigning it immediately

### 8.8 Cost Summary

Card per group with:
- Currency blocks and bucket totals (shared/subset/individual/subtotal)
- Exchange-rate input per currency
- USD equivalent per currency
- Grand total USD when conversion coverage allows

Empty state appears when no summary can be generated.

### 8.9 Modal System

Two modal styles:
- Standard modal: full emphasis for destructive confirmations
- Compact modal: smaller footprint for local actions

Accessibility behavior:
- Dialog role and aria-modal=true
- Focus trapped within dialog
- Escape closes modal
- Backdrop click cancels

### 8.10 Toast Notifications

Toast variants:
- success
- warning
- error

Behavior:
- Auto-dismiss (default 4800ms)
- Manual dismiss button
- Aria-live politeness: error is assertive, others polite
- Repositioning by breakpoint to avoid overlap with sticky UI

### 8.11 Mobile Navigation

On the Trip Cost page only, the mobile navigation is visible only at <=767px as a fixed bottom nav.

Requirements:
- Three tabs map directly to party/costs/summary sections
- Active state uses accent color
- Must remain visible above content while preserving usable vertical space

Landing and tool pages use the shared top-bar grid navigation instead of bottom tabs.

### 8.12 Tool Page Requirements

The currency, timezone, and forecast pages must reuse the shared shell styling and keep their content in the same visual system as the rest of the app.

Requirements:
- Use semantic CSS variables and existing surface, spacing, and typography rules
- Keep focus visibility and keyboard interaction consistent with the rest of the app
- Provide clear loading, empty, success, and error states where data is fetched or searched
- Avoid introducing page-specific colors or alternative component chrome unless the design spec is updated in the same change set

## 9. Accessibility Requirements

Target baseline: WCAG 2.1 AA for color contrast, keyboard access, and focus visibility.

Current required behaviors:
- All interactive controls are keyboard reachable
- Visible focus ring via --focus token and focus-visible selectors
- Modal focus trap and Escape support
- Notification region with aria-live announcements
- Minimum touch target sizing in non-hover environments
- No information conveyed by color alone for critical actions (labels/icons accompany color-coded chips)

Any new component must ship with:
- Keyboard interaction path
- Focus-visible state
- Screen-reader label/role coverage
- Light and dark theme validation

## 10. Error States and User Feedback

### 10.1 Save Validation Warnings

Warnings shown as toasts for blocked save attempts:
- Add a name before saving this cost entry.
- Enter a valid amount that is 0 or higher.
- Solo costs must include at least one group assignment.
- Subset costs must include at least one group assignment.

### 10.2 Storage and Persistence Failures

Error toasts normalized from runtime errors:
- Browser storage is full
- Browser storage blocked in context
- Generic localStorage/persistence failure
- Generic unexpected save failure

### 10.3 Destructive Action Confirmation

Confirmation modal required for:
- Delete cost entry
- Remove group
- Start new trip reset

No destructive action may execute without explicit confirmation.

### 10.4 Save Data Slots and Import Feedback

- Saving a trip whose ID is already present in another slot shows a
  **Duplicate trip ID** warning and does not save or reset the trip.
- Loading an empty slot shows a **Slot is empty** warning. An unsupported saved
  format shows an **Unsupported save format** error; neither replaces the
  active trip.
- A failed import shows an **Import failed** error with the parser message, or
  “Could not read the file.” when no message is available. The active trip
  remains unchanged.
- A successful import with warnings shows **Imported with warnings**.
  Successful Load and Import replace the active trip and cancel any pending
  save-and-start continuation.
- Cancelling an overwrite is not an error: the manager remains open and neither
  the slot nor active trip is changed.

## 11. Logo, Iconography, and Imagery

Logo:
- Shared app icon rendered directly in the top bar logo container
- Logo presentation is controlled by the brand logo container styling rather than runtime SVG path injection

Iconography:
- Lucide React icons used for utility controls and navigation
- Emoji icon set used for group identity selection

Imagery:
- No decorative photography system currently used
- Visual atmosphere created through tokenized colors, subtle dotted background, and component styling

## 12. Voice and Tone for UI Copy

Current UI language style:
- Plain and concise
- Action-first button labels
- Specific, non-technical error messages with clear recovery guidance

Standards:
- Use direct verbs for actions (Add, Remove, Delete, Reset)
- Avoid ambiguous labels
- Keep helper and error text short and outcome-oriented

## 13. Change Management Rules

When changing UI design:
1. Update this spec in the same pull request as implementation changes.
2. If adding/changing a token, update token tables in Section 4.
3. If altering breakpoints or layout behavior, update Section 6.
4. If adding a component or new state, update Section 8 and Section 10 as applicable.
5. Verify light and dark mode parity before merge.

Definition of done for design-affecting changes:
- Updated implementation
- Updated tests where behavior changed
- Updated this design spec

## 14. Version History

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-03-21 | Initial site design specification authored from implemented UI, PRD, and architecture docs. |
| 1.1 | 2026-03-21 | Updated launcher and nav design rules: centered compact landing cards, 2x2 grid navigation tile layout, no dedicated grid-panel close button, and theme-aware icon tone tokens including larger top-bar grid icon sizing. |

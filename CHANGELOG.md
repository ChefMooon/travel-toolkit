# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.1] - 2026-09-29

### Added

- Added the ability to duplicate a cost entry directly from its row.

### Changed

- Refined blog post title links for a clearer appearance.

### Fixed

- Confirmation dialogs now cover the full viewport.
- Tooltips now dismiss when the pointer leaves their trigger.

## [1.3.0] - 2026-09-29

### Added

- Added a Markdown-powered blog with tag-based browsing.
- Trip summaries now show overall totals and each group's share.
- Save-slot swapping now lets you clear a selected slot.

### Changed

- Clarified save status when starting a new trip.
- Improved accessibility and contextual tooltips throughout the Trip Cost experience.
- Improved timezone search and selection.

### Fixed

- Kept the consent banner visible above the mobile tabs.

## [1.2.2] - 2026-04-10

### Added

- Site footer with Cloudflare attribution, copyright display, and route-aware visibility on the Trip tool for smaller viewports

## [1.2.1] - 2026-04-07

### Added

- Bulk delete workflow for selected cost entries, including a confirmation step in the Cost Ledger
- Close buttons in the color and icon selection modals for faster dismissal
- Year-aware forecast events, including event-year display in the Destination Forecast tool

### Changed

- Group theme palette values refined for improved visual balance across the trip UI
- Cost rows, edit rows, and split-assignment surfaces now use theme-aware group colors for more consistent rendering
- Forecast event matching now prefers year-specific results and falls back more cleanly across multi-year date ranges
- Color and icon picker options now expose clearer tooltip and accessibility labels

### Fixed

- Bulk delete now clears stale selection and edit state after removing costs
- Group color rendering no longer depends on fixed CSS values that could drift from the active theme

## [1.2.0] - 2026-03-30

### Added

- Trip data hard limits for performance safety:
	- Max 100 groups
	- Max 50 kids per group
	- Max 1,000 cost entries
- Centralized exported trip limit constants and `TRIP_LIMITS` bundle for reuse by future import/parsing workflows (including planned `.xlsx` import)
- Expanded automated coverage for trip limit enforcement, warning toasts, and name-length truncation behavior in store tests
- Dedicated `TripCostPage` component extraction for the trip tool route, enabling cleaner route composition
- Route-level lazy loading across tool pages (`trip`, `currency`, `timezone`, `forecast`) for improved bundle loading behavior
- Save Slots workflow with three persistent slots, slot rename/swap/clear actions, and slot metadata for quick restore
- Trip Cost `.xlsx` export/import workflow with schema-aware parsing and validation support
- Import/Export Settings controls for schema format (`.xlsx v1` multi-sheet, `.xlsx v2` single-sheet), filename presets, date suffix, and import exchange-rate strategy

### Changed

- Trip store actions now enforce hard limits at the data layer and block writes beyond configured limits
- Reaching a trip limit now surfaces descriptive warning toasts for group, child, and cost-entry capacity
- UI add/create controls now disable at capacity in Group Setup, Cost Ledger, and split-assignment create-group flows
- Trip name, group name, and cost name now enforce maximum lengths in both store logic and relevant input controls
- Cost Ledger table column order updated to show `Type` before `Total` for clearer scanning
- Responsive `s-cards` layout tuned with additional media-query behavior for improved small-screen presentation
- Import/export strategy research updated with a refined single-sheet workbook layout proposal
- Split-assignment modal now includes an explicit modal id to strengthen accessibility/test targeting

---

## [1.1.0] - 2026-03-23

### Added

- Multi-tool navigation shell with dedicated Trip Cost, Currency Converter, Timezone Converter, and Destination Forecast pages
- Currency Converter tool with live Frankfurter exchange-rate snapshots for supported currency pairs
- Timezone Converter tool with configurable tracked timezones, analog and digital clock cards, and browser-timezone detection
- Destination Forecast tool with city geocoding, date-range climate summaries, local-time display, and travel-event overlays
- Expanded automated test coverage for tool pages, timezone components, trip toolbar, split assignment flows, and forecast/currency behavior

### Changed

- Application migrated to TanStack Router file-based routing and TanStack Start SSR for route-based navigation and server-rendered app delivery
- Theme initialization and color-scheme handling improved to reduce preload flicker and keep toggle styling consistent across themes
- Forecast search behavior refined with debounced geocoding, minimum query length safeguards, and request cancellation support
- Tool page layout, grid navigation, and icon styling refined for stronger alignment and more consistent responsive presentation
- Navbar and top bar branding links now use standard anchors for more predictable navigation behavior

### Fixed

- Resolved CostLedger TypeScript build blockers that interrupted successful builds
- Corrected routed app asset/reference wiring issues that affected generated output and shell integration

---

## [1.0.2] - 2026-03-19

### Added

- Global toast notification system integrated across core trip and cost workflows
- Reusable split-assignment modal with group creation support during cost assignment
- Expanded automated test coverage:
	- Responsive behavior tests across viewport sizes
	- Core trip UI flow component tests
	- Unit tests for core calculation functions based on a dedicated calculation test plan
- Mobile navigation for small screens, with viewport-aware behavior

### Changed

- Cost ledger and top bar responsive behavior improved across mobile, tablet, and larger breakpoints
- Cost ledger table column sizing and layout refined for better readability on narrow screens
- Group setup drag-and-drop interactions improved for more reliable reordering
- Edit row and cost row split handling improved with solo fallback logic and split-type auto-reset behavior
- Bulk currency assignment now uses dynamic currency options in the bulk action bar
- Couple card and group setup UI refined with better color handling and accessibility improvements
- Edit row markup controls updated with improved accessibility and clearer color-dot assisted UI
- Component structure refactored into colocated subfolders for better maintainability

### Fixed

- Modal keyboard support and focus trapping improved for accessibility and safer interaction flow
- Mobile navigation visibility now correctly gated by viewport size
- Edit row animation transform behavior adjusted for smoother transitions
- Input and markup number widths/layout consistency issues resolved across responsive views
- Brand asset wiring and SVG handling fixes in app shell and logo integration
- Removed residual checked-in dependency artifacts from repository state

### Security

- Updated dependency: `undici` to 7.24.4

---

## [1.0.1] — 2026-03-10

### Added

- Region selection dropdown — organize currencies by geographic region (North America, Europe, Asia, Oceania, Americas, Africa) with fallback to globally available currencies (CAD, USD)
- Mobile-responsive card layout for cost ledger table with improved readability on small screens
- Comprehensive test suite — integration tests for couple management (icon/color updates, dark mode, persistence) and unit tests for CostRow component
- Favicon and apple touch icons with multiple resolutions for improved bookmark/home screen experience

### Fixed

- Improved responsive grid layout in edit components for better mobile UX
- Enhanced body styling with border-radius for consistent rounded corners across mobile layouts
- Page title consistency for better tab/browser identification
- Refined mobile button styling — hide text labels on screens ≤479px for improved space efficiency
- Improved trip pill constraints — added flex-shrink and max-width for better text overflow handling on mobile
- Enhanced markup pill and button responsive breakpoints — optimized spacing and font sizing for ultra-small screens
- Improved button text alignment (markup number input centered for better visual balance)
- Refined New Trip button markup structure with `<span>` wrapper for better responsive control

---

## [1.0.0] — 2026-03-10

### Added

- Group setup with paying couples (auto-named, renameable, drag-and-drop reorderable) and non-paying travellers linked to parent couples
- Cost ledger with manual entry, inline editing, and confirmed deletion
- Three split modes: `shared` (all couples), `subset` (selected couples), `individual` (one couple)
- Global cost markup percentage with per-cost override; effective rate always visible on every cost row
- Multi-currency support — costs retain their original currency and are never auto-converted
- Per-couple cost summary broken down by currency (shared, subset, and individual buckets)
- Exchange rate input per currency to convert foreign totals to USD
- Drag-and-drop reordering of cost entries
- Bulk currency assignment — select multiple cost entries and apply a currency in one action
- Half-up rounding to 2 decimal places; rounding remainder applied to the first couple in the list
- `localStorage` persistence via Zustand `persist` middleware — all state saved automatically, restored on page load
- Start New Trip action with confirmation prompt; clears all `localStorage` data and resets to initial state
- Light and dark theme with toggle; theme preference persisted to `localStorage`

[Unreleased]: https://github.com/ChefMooon/travel-toolkit/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/ChefMooon/travel-toolkit/compare/v1.2.1...v1.2.2
[1.2.0]: https://github.com/ChefMooon/travel-toolkit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ChefMooon/travel-toolkit/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/ChefMooon/travel-toolkit/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ChefMooon/travel-toolkit/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ChefMooon/travel-toolkit/releases/tag/v1.0.0

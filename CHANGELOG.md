# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

[Unreleased]: https://github.com/ChefMooon/mkt/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/ChefMooon/mkt/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ChefMooon/mkt/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ChefMooon/mkt/releases/tag/v1.0.0

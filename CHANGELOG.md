# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

[Unreleased]: https://github.com/ChefMooon/mkt/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/ChefMooon/mkt/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ChefMooon/mkt/releases/tag/v1.0.0

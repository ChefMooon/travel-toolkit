# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

[Unreleased]: https://github.com/ChefMooon/mkt/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ChefMooon/mkt/releases/tag/v1.0.0

# MKT PRD

**Product Requirements Document**

_Version 1.3 | March 2026 | Status: Draft_

---

## Document Metadata

|Field|Value|
|---|---|
|**Product Name**|Trip Cost Splitter|
|**Version**|1.3|
|**Status**|Draft|
|**Date**|March 2026|
|**Owner**|TBD|
|**Stakeholders**|TBD|

---

## 1. Overview

Trip Cost Splitter is a static web-based calculation tool that helps groups of couples (and mixed traveller types) fairly divide shared and individual trip expenses. It handles multi-currency costs, configurable cost markups, flexible group compositions including children or non-paying travellers, and subset splitting for costs shared among only some couples. Trip data is persisted automatically in the browser via `localStorage` and can be fully cleared via a confirmed "Start New Trip" action.

---

## 2. Problem Statement

When two or more couples travel together, costs fall into two categories: shared costs (e.g. accommodation, group meals, transport) and individual costs. Shared costs should be split across couples rather than applied in full to each couple. Without a dedicated tool, this calculation becomes error-prone, especially when:

- Costs are recorded in multiple foreign currencies
- A cost markup (e.g. credit card foreign transaction fee) applies globally or per-cost
- The group includes non-paying travellers such as children
- More than two couples are travelling together
- Some costs are shared among only a subset of couples (e.g. a side excursion)

---

## 3. Goals & Non-Goals

### 3.1 Goals

- Allow users to log trip costs with key attributes and designate each as shared (all couples), subset-shared (select couples), or individual
- Split shared and subset-shared costs equitably across the relevant paying couples
- Support multiple currencies and preserve them separately for manual conversion to USD
- Apply a global cost markup with per-cost overrides, surfaced clearly in the UI
- Handle groups of 2+ couples and non-paying travellers (children)
- Allow editing and deleting of any cost entry (with confirmation on delete)
- Allow drag-and-drop reordering of cost entries
- Auto-name couples with the option to rename them
- Persist all trip data automatically in the browser via `localStorage`
- Allow the user to reset all data and start a new trip (with confirmation)

### 3.2 Non-Goals

- Real-time currency conversion (exchange rates are applied manually by the user)
- Payment reconciliation or settlement between individuals
- Cloud sync or multi-device collaboration (v1)
- Data export (PDF, CSV) — v1 calculation only
- Mobile app or CLI — static website only

---

## 4. Users & Traveller Types

The tool models a trip group as a collection of traveller records. Two types exist:

### 4.1 Paying Couple

A unit of one or two adults who share responsibility for paying their portion of costs. Shared costs are divided by the number of paying couples included in a given cost. Each couple is a single billing unit regardless of whether it contains one or two people.

Couples are auto-named sequentially (Couple 1, Couple 2, ...) when added. The user may rename any couple at any time by editing the name inline.

### 4.2 Non-Paying Traveller (e.g. Child)

A traveller who participates in the trip but is not assigned any cost share. Non-paying travellers are excluded from the shared cost divisor. Their presence does not affect how costs are split among couples.

> **Example:** 3 couples + 2 children travel together. A shared hotel cost is divided by 3 (couples only), not 5.

---

## 5. Cost Model

### 5.1 Cost Attributes

Each cost entry contains the following fields:

|Field|Type|Description|
|---|---|---|
|**name**|_String_|A short label describing the cost (e.g. 'Hotel Night 1', 'Dinner').|
|**currency**|_Currency Code_|The currency this cost was incurred in (e.g. USD, EUR, MXN). Costs in different currencies are kept separate.|
|**value**|_Decimal_|The base monetary amount of the cost before any markup is applied.|
|**cost_markup**|_Percentage_|A per-cost markup percentage. Defaults to the global markup. Can be set to any value including 0%. Displayed explicitly in the cost entry row so the user always sees the effective rate.|
|**split_type**|_Enum_|One of: `shared` (all paying couples), `subset` (selected paying couples only), or `individual` (one couple).|
|**assigned_couples**|_Reference[]_|For `subset`: the list of couples sharing this cost. For `individual`: the single couple responsible. Unused for `shared`.|
|**sort_order**|_Integer_|The display order of this cost entry. Updated when the user reorders via drag-and-drop.|

### 5.2 Cost Entry

- Costs are entered manually by the user.
- Multiple costs can be entered per trip.
- Any cost entry can be edited or deleted at any time.
- Cost entries can be reordered via drag-and-drop.
- Users may select a set of costs and bulk-update their currency.

---

## 6. Cost Markup

### 6.1 Global Markup

A single global markup percentage is configured at the trip level. This markup is applied to all costs by default. Common use case: a service fee or tip percentage (e.g. 66%) applied uniformly to all expenses.

### 6.2 Per-Cost Markup Override

Individual costs can override the global markup. The per-cost markup can be set higher or lower than the global value, including zero (no markup) or a custom rate. This allows exceptions such as costs charged on a no-fee card.

### 6.3 Markup UI Requirement

The effective markup rate must be visible on every cost entry row — not hidden behind an edit screen. When a cost uses the global default, it should be labelled as such (e.g. "66% (global)"). When overridden, the custom value is shown with a visual indicator (e.g. "0% (custom)"). This prevents silent errors from forgotten overrides.

> **Rule:** Final cost value = base value × (1 + effective_markup%). Effective markup defaults to global unless a per-cost override is set.

---

## 7. Currency Handling

Costs may be entered in any currency. The tool does not perform automatic currency conversion. The workflow is:

1. The user enters all costs in their original foreign currencies.
2. The tool calculates and displays per-couple subtotals grouped by currency.
3. Once the user has reviewed all totals in their original currencies, they enter exchange rates to convert each currency group to USD.
4. The tool displays a final USD total per couple.

> **Rationale:** Showing foreign currency totals first preserves accuracy and gives users the chance to verify figures before applying exchange rates.

### 7.1 Bulk Currency Assignment

The user can select one or more cost entries and assign them to a specific currency in a single action. This streamlines data entry when many costs share the same currency.

---

## 8. Cost Splitting Logic

### 8.1 Shared Costs

Shared costs are divided equally among all paying couples.

> **Formula:** Each couple's share = (cost value × (1 + markup%)) / number_of_paying_couples

### 8.2 Subset-Shared Costs

Subset-shared costs are divided equally among the selected subset of couples only. The divisor is the count of couples in the subset.

> **Formula:** Each included couple's share = (cost value × (1 + markup%)) / number_of_couples_in_subset

Couples not included in the subset owe nothing for this cost.

### 8.3 Individual Costs

Individual costs are assigned to a single couple and are not split. They appear in full in that couple's summary.

### 8.4 Rounding

All per-couple amounts are rounded to 2 decimal places using **half-up rounding** (e.g. $0.005 → $0.01). Where rounding produces a remainder, the difference is added to the first couple in the list. This ensures the sum of all couples' shares always equals the total cost exactly.

> **Note:** This rounding rule is provisional and may be revised if real-world testing reveals issues.

### 8.5 Output

The tool produces a summary per couple broken down by currency, showing:

- Total of shared costs allocated to that couple (per currency)
- Total of subset-shared costs allocated to that couple (per currency)
- Total of individual costs assigned to that couple (per currency)
- Combined subtotal per foreign currency
- USD equivalent (once the user enters an exchange rate for each currency)
- Grand total in USD across all currencies

---

## 9. Data Persistence

### 9.1 localStorage

All trip data is automatically saved to the browser's `localStorage` after every user action. On page load, the tool restores the previous session from `localStorage` if data is present. No manual save action is required.

The persisted state includes: group composition (couples and non-paying travellers), all cost entries (including sort order), global markup setting, and any exchange rates the user has entered.

### 9.2 Start New Trip (Reset)

A clearly labelled "Start New Trip" button is available at all times. When triggered, the tool displays a confirmation prompt warning the user that all current trip data will be permanently deleted. The reset only proceeds if the user confirms. On confirmation, all `localStorage` data is cleared and the tool returns to its initial empty state.

### 9.3 Limitations

`localStorage` is scoped to the device and browser. Data will be lost if the user clears browser storage. Cross-device access and sharing are not supported in v1.

---

## 10. Edge Cases & Constraints

### 10.1 More Than Two Couples

The splitting logic must support any number of paying couples (2 or more). The shared cost divisor adjusts dynamically based on the current couple count or subset size.

### 10.2 Non-Paying Travellers (Children)

Children or other non-paying travellers are tracked in the group but excluded from cost splitting. They do not increase the divisor for shared or subset costs.

### 10.3 Mixed Currencies in a Single Trip

A trip may have costs in multiple currencies simultaneously. The tool must not aggregate costs across currencies. Each currency must remain as a distinct bucket in all calculations and outputs until the user applies exchange rates.

### 10.4 Single Couple

If only one couple is present, all shared costs are assigned 100% to that couple. Subset costs with only one couple selected behave identically. The tool should not error on this edge case.

### 10.5 Zero Markup

A global or per-cost markup of 0% is valid. The effective cost equals the base value.

### 10.6 Subset of One

A subset cost assigned to exactly one couple is functionally equivalent to an individual cost. The tool should accept this without error.

### 10.7 Renaming Couples

Renaming a couple updates all references to that couple throughout the cost list and output summary. No costs are lost or reassigned.

---

## 11. Functional Requirements

**FR-01: Add Cost Entry** The user can manually add a cost entry specifying: name, currency, value, split type (shared / subset / individual), assigned couples (for subset or individual), and optionally a per-cost markup override.

**FR-02: Edit Cost Entry** The user can edit any field of an existing cost entry at any time.

**FR-03: Delete Cost Entry** The user can delete any cost entry. A confirmation prompt is shown before the deletion is applied. The summary updates immediately after confirmation.

**FR-04: Reorder Cost Entries** The user can drag and drop cost entries to change their display order. The new order is persisted to `localStorage`.

**FR-05: Configure Global Markup** The user can set a global markup percentage that applies to all costs by default.

**FR-06: Override Markup Per Cost** The user can set a custom markup on any individual cost, overriding the global markup for that entry. The effective markup is always visible on the cost row.

**FR-07: Bulk Currency Assignment** The user can select multiple cost entries and assign them to a specific currency in one action.

**FR-08: Manage Group Composition** The user can add paying couples and non-paying travellers to the trip group. Couples are auto-named (Couple 1, Couple 2, ...) and can be renamed at any time. Non-paying travellers are excluded from cost splitting.

**FR-09: Subset Splitting** When adding or editing a cost, the user can select `subset` as the split type and choose which paying couples are included. The cost is split only among the selected couples.

**FR-10: Compute Per-Couple Summary** The tool calculates and displays each couple's cost share in real time, separated by currency, including shared, subset, and individual allocations.

**FR-11: Currency Conversion to USD** After reviewing per-couple totals in foreign currencies, the user can enter an exchange rate for each currency. The tool then displays USD-equivalent totals and a grand total per couple in USD.

**FR-12: Multi-Currency Output** All output totals are presented grouped by currency before conversion. No automatic currency conversion is performed.

**FR-13: Persist State via localStorage** All trip data is saved to `localStorage` automatically after every change. The full session is restored on page load.

**FR-14: Start New Trip (Reset)** A "Start New Trip" button is available at all times. It triggers a confirmation prompt before clearing all `localStorage` data and resetting the tool to its initial empty state.

**FR-15: Region Selection for Currencies** A geographic region selector allows users to filter the available currency list by region (North America, Europe, Asia, Oceania, Americas, Africa). CAD and USD are always available in all regions as fallbacks. Region selection simplifies currency picking on multi-region trips without limiting access to any currency.

---

## 12. Testing & Quality Assurance

### Testing Framework

The project uses **Vitest** with **React Testing Library** for test authoring and execution.

### Test Coverage (v1.0.1)

- **Couple Management** — Tests verify adding, renaming, and reordering couples; colour and icon updates persist and display correctly.
- **Dark Mode** — Integration tests confirm theme toggling works and persists to `localStorage`.
- **State Persistence** — Tests verify that all store state (couples, costs, exchange rates, region, theme) is saved and restored from `localStorage` correctly.
- **CostRow Component** — Unit tests cover rendering, inline editing workflows, and currency/markup display.

### Running Tests

```sh
npm run test          # Run all tests once
npm run test:watch    # Watch mode for development
```

### Future Testing Goals

- Expand CostRow and EditRow test coverage to include all split types and edge cases (single couple, zero markup, etc.)
- Integration tests for bulk currency assignment and drag-and-drop reordering
- Exchange rate calculation tests across all currency combinations

---

## 13. Open Questions

There are no remaining open questions. All decisions have been resolved as of v1.4.

---

## 14. Version History

|Version|Date|Author|Notes|
|---|---|---|---|
|1.0|March 2026|TBD|Initial draft from brainstorm notes.|
|1.1|March 2026|TBD|Resolved open questions: subset splitting, auto-naming with editable couple names, half-up rounding, currency workflow clarified (foreign → USD), markup always visible in UI, edit/delete on cost entries, platform confirmed as static website, export deferred.|
|1.2|March 2026|TBD|Added localStorage persistence, confirmation prompt on cost entry deletion, drag-and-drop reordering of cost entries.|
|1.3|March 2026|TBD|Added Start New Trip reset with confirmation prompt. All open questions resolved.|
|1.4|March 2026|TBD|Added Region Selection filtering for currencies. Documented testing framework and coverage. Implemented mobile responsiveness with card layouts and responsive grids.|
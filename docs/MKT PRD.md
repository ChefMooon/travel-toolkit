# MKT PRD

**Product Requirements Document**

_Version 2.0 | March 2026 | Status: Draft_

---

## Document Metadata

| Field | Value |
|---|---|
| Product Name | MKT |
| Product Positioning | Travel Toolkit |
| Version | 2.0 |
| Status | Draft |
| Date | March 2026 |
| Owner | TBD |
| Stakeholders | TBD |

---

## 1. Overview

MKT is a browser-based travel toolkit that brings together four planning utilities in one product:

- **Trip Cost** to calculate shared and split costs across trip groups
- **Currency Converter** to convert between currencies with live rates
- **Timezone Tracker** to save and track timezones for different locations
- **Destination Forecast** to check weather and event forecasts before travel

The product goal is to reduce the need to juggle separate travel calculators, timezone tools, and destination research tabs while planning a trip.

---

## 2. Problem Statement

Travel planning is often fragmented across multiple unrelated tools. A user may need one app to split group costs, another to compare currencies, another to track local times, and another to estimate weather conditions for upcoming dates. That fragmentation creates unnecessary context switching, repeated data entry, and avoidable planning mistakes.

This is especially painful when:

- A group trip includes both shared and individual costs
- Travelers need quick conversion context while budgeting
- Multiple destinations or remote contacts make timezone awareness important
- The trip depends on seasonal conditions or known local events
- The user wants lightweight planning help without accounts, syncing, or a full itinerary platform

MKT solves this by packaging the most common pre-trip planning utilities into one lightweight web app.

---

## 3. Goals

- Provide a single travel toolkit that lets users move between planning utilities without leaving the product
- Keep the app fast, simple, and usable without account creation
- Support group trip budgeting with fair cost splitting, markup handling, and multi-currency summaries
- Support quick currency conversion for common travel currencies
- Support saved timezone tracking for destinations or travel contacts
- Support destination research using searchable locations, weather context, and relevant event context
- Work well on both desktop and mobile form factors
- Preserve user state locally between sessions where persistence improves continuity

---

## 4. Non-Goals

- Booking flights, hotels, transport, or activities
- Payment settlement, debt collection, or reimbursement workflows
- Real-time collaboration across multiple users or devices
- Cloud sync, user accounts, or profile management in the current scope
- Full itinerary building or calendar planning
- Export workflows such as CSV, PDF, or shareable reports in the current scope
- A native mobile app or CLI version in the current scope

---

## 5. Primary Users

### 5.1 Group Trip Organizer

A traveler coordinating shared costs for a group and needing a clear way to divide expenses fairly.

### 5.2 Independent Traveler

A traveler who wants lightweight utilities such as currency conversion, timezone tracking, or destination planning without using several separate apps.

### 5.3 Pre-Trip Researcher

A user checking whether a destination fits a travel window by comparing time, climate patterns, and notable events.

---

## 6. Core Use Cases

- As a group trip organizer, I want to split shared costs across selected groups so I can see what each group owes.
- As a group trip organizer, I want to keep costs in their original currencies until I choose exchange rates so I can verify totals before converting to USD.
- As a traveler, I want to convert between common currencies quickly so I can sanity-check costs while planning.
- As a traveler, I want to save several timezone cards so I can compare local times across destinations or contacts.
- As a traveler, I want to search a destination and travel window so I can review climate averages before I commit to dates.
- As a traveler, I want to see relevant events during my selected dates so I can factor them into my planning.

---

## 7. Product Scope

### 7.1 Toolkit Home and Navigation

The product must provide a home view that introduces the toolkit and lets users open each tool from one place.

Requirements:

- Users can launch each tool from a shared home page
- Users can move between tools from shared navigation
- Tool names and descriptions should make each workflow immediately understandable

### 7.2 Trip Cost

The Trip Cost tool is the budgeting and cost-splitting workspace for group travel.

Requirements:

- Users can create and manage paying groups
- Users can add non-paying travellers who are visible in the trip setup but excluded from split divisors
- Users can add costs with a name, amount, currency, split mode, and optional custom markup
- Users can assign costs as shared, subset, or individual
- Users can edit and delete costs after creation
- Users can reorder costs
- Users can bulk-assign currencies to selected costs
- Users can set a trip-wide default markup and override it per cost
- Users can review per-group totals grouped by original currency
- Users can enter manual exchange rates to compute USD totals once they are ready
- Users can reset the trip and start fresh after explicit confirmation

### 7.3 Currency Converter

The Currency Converter provides quick conversion context without requiring the user to manage a full trip ledger.

Requirements:

- Users can enter an amount and choose base and target currencies
- The tool supports a defined set of common travel currencies
- The tool shows the selected conversion result and the current displayed conversion rate
- The tool handles loading and retry states clearly if data is unavailable

### 7.4 Timezone Tracker

The Timezone Tracker helps users save and track timezones for different locations.

Requirements:

- Users can set a local timezone reference
- Users can add, remove, rename, and reorder tracked timezones
- Users can choose how each timezone card is displayed
- Users can toggle supplemental details such as UTC, date, and seconds visibility
- Saved timezone configuration should persist between sessions

### 7.5 Destination Forecast

The Destination Forecast tool supports lightweight destination planning around weather and date-specific event context.

Requirements:

- Users can search for destinations by name
- Users can choose a travel date range
- The tool shows destination context including local time and location metadata
- The tool shows weather and climate context for the selected destination and date range
- The tool surfaces matching destination events when available
- The tool handles empty, loading, and error states clearly

---

## 8. Success Criteria

The product will be considered successful for the current scope when:

- A user can reach all four tools from one shared app experience without needing separate products or tabs for the same core workflows
- A group trip organizer can complete a full trip-cost workflow from setup to USD summary in the Trip Cost tool without external calculation help
- A traveler can compare supported currencies, save timezone references, and inspect destination weather context within the same app session
- Core workflows remain usable on mobile and desktop layouts
- User continuity is preserved through local persistence for the workflows that benefit from it

---

## 9. Constraints

- The product is a web app and must remain lightweight to open and use quickly
- The current scope assumes no user account system and no server-owned personal data model
- Some features depend on external data availability and may occasionally be unavailable
- The Currency Converter is limited to its supported currency set in the current scope
- Destination Forecast quality depends on destination search resolution and available weather or event data
- Persisted data is local to the current browser environment and is not shared across devices

---

## 10. Functional Requirements

### 10.1 Shared Product Requirements

**FR-01: Toolkit Launch** The product must provide a home view that presents each available tool and lets the user open it directly.

**FR-02: Shared Navigation** The product must allow users to move between tools without leaving the app shell.

**FR-03: Responsive Layout** All core workflows must remain usable across mobile and desktop screen sizes.

**FR-04: Theme Support** The product must support both light and dark presentation modes.

### 10.2 Trip Cost Requirements

**FR-05: Manage Paying Groups** The user can add, rename, reorder, and remove paying groups.

**FR-06: Manage Non-Paying Travellers** The user can add and remove non-paying travellers linked to a paying group.

**FR-07: Add Cost Entry** The user can create a cost entry with a name, currency, amount, split type, assignment details, and optional custom markup.

**FR-08: Edit or Delete Cost Entry** The user can edit any cost entry and can delete a cost entry with confirmation.

**FR-09: Reorder Costs** The user can reorder cost entries and retain that order during the session.

**FR-10: Bulk Currency Assignment** The user can select multiple costs and assign one currency to the selection.

**FR-11: Split Modes** The tool must support shared, subset, and individual cost assignment.

**FR-12: Multi-Currency Summary** The tool must keep trip costs grouped by original currency before conversion.

**FR-13: Manual USD Conversion** The user can enter exchange rates to compute USD totals after reviewing original-currency summaries.

**FR-14: Trip Reset** The user can clear current trip data only after a deliberate confirmation step.

### 10.3 Currency Converter Requirements

**FR-15: Amount Conversion** The user can convert a numeric amount between supported currencies.

**FR-16: Rate Display** The tool must display the rate used for the selected base and target currencies.

**FR-17: Error Recovery** If conversion data cannot be loaded, the tool must show an error state with a retry path.

### 10.4 Timezone Tracker Requirements

**FR-18: Local Timezone Selection** The user can set or detect a local timezone reference.

**FR-19: Tracked Timezones** The user can add, edit, remove, and reorder tracked timezones.

**FR-20: Card Customization** The user can choose display style and detail visibility for each tracked timezone.

**FR-21: Timezone Persistence** Saved timezone configuration must persist between sessions in the same browser environment.

### 10.5 Destination Forecast Requirements

**FR-22: Destination Search** The user can search for a destination and select from matching results.

**FR-23: Date-Range Forecasting** The user can choose a date range and view destination weather context for that window.

**FR-24: Destination Context** The tool must show local-time and location context for the selected destination.

**FR-25: Event Overlay** The tool should show relevant destination events that overlap with the selected dates when available.

**FR-26: Forecast States** The tool must provide understandable empty, loading, and error states.

---

## 11. Product Rules and Behavioral Notes

### 11.1 Trip Cost Rules

- Shared trip costs are divided across all paying groups
- Subset costs are divided only across the selected paying groups
- Individual costs are assigned in full to one paying group
- Non-paying travellers never affect the split divisor
- Original-currency totals remain separate until the user supplies exchange rates

### 11.2 Toolkit Scope Rules

- The product is planning-oriented, not transaction-oriented
- The product may help users estimate and compare, but it does not complete bookings or payments
- The product favors lightweight local persistence over account-based storage in the current scope

---

## 12. Risks and Open Questions

### Risks

- Users may assume all external data is live and real-time across every tool
- Users may expect cloud sync once multiple tools are present in one product
- Third-party forecast data availability can affect perceived reliability

### Open Questions

- Should future versions unify the terminology around "trip groups" versus "couples" in the Trip Cost tool UI?
- Should the Currency Converter expand beyond the currently supported currency set?
- Should the toolkit eventually support saved destinations or trip presets across tools?

---

## 13. Version History

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | March 2026 | TBD | Initial trip cost splitter PRD draft. |
| 1.1 | March 2026 | TBD | Clarified trip cost splitting, markup behavior, and currency workflow. |
| 1.2 | March 2026 | TBD | Added persistence, deletion confirmation, and drag-and-drop support to scope. |
| 1.3 | March 2026 | TBD | Added trip reset workflow and related UX requirements. |
| 2.0 | March 2026 | TBD | Reframed MKT as a travel toolkit covering Trip Cost, Currency Converter, Timezone Tracker, and Destination Forecast. Aligned product naming and tool descriptions to the current source of truth in `src/lib/tools.ts`, and added core use cases, success criteria, cross-tool scope, and current product constraints. |
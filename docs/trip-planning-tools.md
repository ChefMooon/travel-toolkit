# Trip Planning Tool Ideas

This document evaluates six travel-planning tools that could complement Trip
Cost. The goal is to make the `/trip` page a useful home for both the trip
budget and the practical details behind it, without mixing planning data into
expense calculations.

## Scores

Scores are directional estimates for an initial version, not delivery
estimates. **Usefulness** rates how much the tool could help a traveler;
**ease** rates how straightforward it would be to ship a useful first version.
Both use a 1-5 scale, with 5 as the highest score. **Priority** is usefulness
multiplied by ease, out of 25.

| Tool | Usefulness | Ease | Priority |
|---|---:|---:|---:|
| Unit converter | 4/5 | 4/5 | 16/25 |
| Travel-day countdown | 4/5 | 4/5 | 16/25 |
| Packing checklist | 5/5 | 3/5 | 15/25 |
| Itinerary | 5/5 | 2/5 | 10/25 |
| Visa and entry information | 5/5 | 2/5 | 10/25 |
| Tipping guide | 3/5 | 3/5 | 9/25 |

## Tool Ideas

### Unit converter

**What it does:** Converts common travel measurements, such as temperature,
distance, weight, and volume.

**How it helps:** Travelers can interpret weather forecasts, road distances,
luggage limits, and local measurements without leaving the trip workspace.

**How it could fit into Trip Cost:** Add a compact converter to a trip-planning
panel on `/trip`. It can work independently at first, with optional destination
defaults for Celsius/Fahrenheit and kilometers/miles. Keep conversions separate
from cost entries and currency exchange rates: physical units and currencies
are different kinds of conversion.

**First version:** Provide well-known conversions locally, with the input and
result clearly labeled and easy to swap. No external API or trip data changes
are required.

**Implementation result:** The standalone `/units` tool converts temperature,
distance, weight, and volume locally. It supports negative values, unit swaps,
and explicitly distinguishes US and Imperial volume measures. The converter
uses shared controls and is available from the launcher and tool navigation;
it does not persist inputs or modify a trip.

**Future Trip integration:** Reuse the conversion definitions and calculation
function in a compact Trip Plan panel. Keep its input state independent of the
cost ledger. If destination metadata is added later, use it only to suggest
measurement defaults, while letting travelers override them. Decide separately
whether converter preferences should persist; no trip schema change is needed
to embed the initial converter.

### Travel-day countdown

**What it does:** Shows the number of days until the trip begins, and optionally
the number of days remaining while the trip is underway.

**How it helps:** Keeps departure timing visible while travelers build and
review their budget.

**How it could fit into Trip Cost:** Show a small countdown beside the trip
name in the toolbar or at the top of a planning panel. Use the optional trip start date already stored in trip details, sharing it
with related tools rather than maintaining separate dates.

**First version:** Support a start date and a clear empty state when no date is
set. Calculate by calendar day in the traveler's local timezone; define how
past dates and an active trip are displayed.

**Implementation result:** The standalone `/countdown` page accepts independent
start and optional end dates and does not change Trip Cost data. It validates
date-only values, counts by UTC calendar ordinals against the local calendar
date (so daylight-saving transitions do not alter day counts), and handles
upcoming trips, trips starting today, active trips with inclusive duration and
remaining days excluding today, ended trips, and past starts without an end
date. Its local date refreshes at midnight and when the page regains focus or
visibility. Trip Cost also shows a compact strip below its toolbar whenever a
committed trip start date exists, using the same calculation. The standalone
tool keeps its own date inputs. Opening it from the strip copies the committed
trip dates into those inputs; subsequent edits remain independent of Trip Cost.
Neither countdown surface mutates trip data.

### Packing checklist

**What it does:** Lets travelers add, check off, and organize items to pack.

**How it helps:** Prevents forgotten essentials and gives travelers a practical
task list that can be revisited alongside their trip budget.

**How it could fit into Trip Cost:** Add a Packing section to the trip-planning
panel. Start with editable checklist items and optional categories such as
documents, clothing, and toiletries. Later, use the destination, dates, and
forecast to suggest items, but keep suggestions reviewable rather than
automatically marking anything as packed.

**First version:** Persist checklist entries with the trip so each trip has its
own list. Include add, edit, check off, and remove actions; do not make a
forecast dependency necessary for the checklist to work.

### Itinerary

**What it does:** Organizes trip plans by date, with optional times, locations,
notes, and links.

**How it helps:** Brings reservations and daily plans together with the budget,
making it easier to relate planned activities to costs.

**How it could fit into Trip Cost:** Add an Itinerary section that uses the
trip's start and end dates. A future enhancement could let a traveler link an
itinerary item to a cost entry, but the first version should not change how
costs are split or summarized.

**First version:** Support dated items with a title and optional time, notes,
and location. This needs a new data model and careful handling of items when
trip dates change, so it is a larger feature than a checklist.

### Visa and entry information

**What it does:** Helps travelers find entry requirements for a destination,
such as visa rules, passport validity guidance, and arrival forms.

**How it helps:** Entry requirements can affect whether a traveler can take the
trip at all, so timely, trustworthy information is valuable.

**How it could fit into Trip Cost:** Show a destination-specific entry-info
card in the planning panel, with links to official government or embassy
sources. The trip would need a destination and, for personalized guidance, the
traveler's passport country. Do not infer a traveler's nationality or present
general information as a definitive eligibility decision.

**First version:** Prefer clearly attributed links to authoritative sources
over an in-app rules database. Requirements change and can depend on
nationality, transit, and trip purpose; any future summaries need visible
sources, last-checked dates, and a reminder to verify with official authorities.

### Tipping guide

**What it does:** Summarizes common tipping expectations for services in the
destination.

**How it helps:** Gives travelers a quick cultural and budgeting reference for
restaurants, taxis, hotels, and other common situations.

**How it could fit into Trip Cost:** Add a destination-aware reference card in
the planning panel. It could provide concise notes and examples, while leaving
the traveler in control of whether and how much to tip. Tipping should remain
an optional expense entered through the existing cost ledger.

**First version:** Use a small, sourced set of destination guides or links to
reliable references. Avoid presenting a single percentage as a universal rule;
expectations vary by service, location, and whether a service charge is
included.

## Integration Notes

The current Trip Cost page is centered on trip groups, costs, and summaries.
Its Zustand trip store persists trip data locally, and saved trip snapshots
provide a natural place for future planning data to travel with a budget.
Trip details include optional start and end dates, but no destination.

An eventual shared trip context can reuse the existing optional dates and add
a destination when needed, then let tools use them where relevant. Keep planning data separate from
cost entries so checklists, itinerary notes, and reference information do not
affect totals, currency conversion, or expense splitting. Any data added to a
trip should be considered across persistence, saved-trip loading, reset, and
undo/redo behavior.

For discovery, a single **Trip Plan** panel or section on `/trip` could hold
these tools. On smaller screens, it should fit the existing mobile navigation
pattern rather than squeezing more controls into the cost ledger. The unit
converter can be useful without trip metadata; countdown and destination-based
tools become more useful once destination data is available and trip dates are set.

## Suggested Order

1. **Unit converter** — useful immediately, with no external data or trip-model
   changes.
2. **Travel-day countdown** — implemented as a standalone tool and a compact
   Trip Cost strip using existing trip dates.
3. **Packing checklist** — high traveler value and a natural use for
   trip-specific saved data.
4. **Itinerary** — valuable, but requires a richer dated-item model and
   decisions about date changes.
5. **Tipping guide** — start with sourced references after destination support
   exists.
6. **Visa and entry information** — start with official-source links; defer
   in-app requirement summaries until their accuracy and maintenance can be
   supported.

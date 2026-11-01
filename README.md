# Travel Toolkit

Travel Toolkit is a travel planning toolkit built with TanStack Start and deployed to Cloudflare Workers. It combines six focused tools in one app: a trip cost splitter, currency and unit converters, a timezone tracker, a destination forecast planner, and a travel countdown.

## What Travel Toolkit Includes

- **Trip Cost** — split shared, subset, or individual expenses across trip groups with multi-currency entries and USD rollups
- **Currency Converter** — compare exchange-rate snapshots across supported currencies
- **Timezone Tracker** — track and customize timezones for the places that matter to your trip
- **Unit Converter** — convert temperature, distance, weight, and volume measurements for travel
- **Destination Forecast** — search destinations, inspect climate averages by date range, and surface matching events
- **Travel Countdown** — track upcoming, active, and past trips using their dates

## Features

- **Six travel tools in one app** — launch tools from the home page and move between them with the shared grid navigation
- **Flexible trip cost splitting** — use shared, subset, or individual assignment modes for each cost
- **Trip-level and per-cost markup** — set a global markup and override it on individual entries when needed
- **Multi-currency trip logging** — keep original trip currencies, filter available currencies by region, and add manual USD exchange rates for final totals
- **Bulk actions and drag-and-drop** — reorder costs and apply currencies to multiple entries at once
- **Non-paying travellers** — add children or other non-paying members without affecting the split divisor
- **Snapshot currency conversion** — convert between USD, EUR, GBP, CAD, JPY, and AUD using in-app rate snapshots
- **Configurable timezone cards** — save tracked zones, detect the browser timezone, reorder cards, and choose analog or digital display modes
- **Destination climate lookup** — search locations, choose a date range, view climate averages, and compare local time at the destination
- **Forecast event overlay** — show curated destination events that overlap with the selected trip dates
- **Trip dates and countdown** — set trip dates, see a countdown in Trip Cost, and open the standalone countdown tool
- **Global travel preferences** — save a preferred trip region and use browser-language detection on first use
- **Persistent local state** — trip data, site preferences, and timezone settings are stored in `localStorage`; transient UI state stays in memory
- **Responsive theming** — choose System, Light, or Dark across the app; System follows the device color scheme

## Getting Started

1. Open the Travel Toolkit home page.
2. Choose a tool from the launcher grid.
3. Use the shared navigation in the top bar to switch tools without leaving the app shell.

Example workflow:

- Open **Trip Cost** to build a trip ledger, assign costs, and enter manual USD rates for final totals.
- Set the trip dates to see a countdown, or open **Travel Countdown** to check dates independently.
- Open **Timezone Tracker** to save destination clocks for the same trip.
- Use **Unit Converter** to convert temperatures, distances, weights, or volumes.
- Open **Destination Forecast** to search a city, pick travel dates, and check climate averages plus matching events.

## Available Routes

| Route | Tool | Purpose |
|---|---|---|
| `/` | Travel Toolkit home | Launch and navigate between tools |
| `/trip` | Trip Cost | Split group expenses and summarize totals |
| `/currency` | Currency Converter | Convert supported currencies using snapshot data |
| `/timezone` | Timezone Tracker | Track and customize saved timezone cards |
| `/units` | Unit Converter | Convert temperature, distance, weight, and volume |
| `/forecast` | Destination Forecast | Search destinations and inspect date-range climate data |
| `/countdown` | Travel Countdown | Track upcoming, active, and past trips from their dates |
| `/blog` | Blog | Browse published articles and changelogs, with tag filtering |
| `/blog/:slug` | Blog | Read a published post using its filename-derived slug |

## Saving Your Settings

Trip information, timezone cards, and preferences are saved in your browser on this device. They are not synced between devices.

## Appearance

Choose **System**, **Light**, or **Dark** in the top bar. System mode follows your device's appearance setting, and the layout adapts to smaller screens.

For maintainers, [blog publishing and project structure guidance](docs/CONTENT-AND-STRUCTURE.md) is available separately.

## License

MIT. See [LICENSE](LICENSE).

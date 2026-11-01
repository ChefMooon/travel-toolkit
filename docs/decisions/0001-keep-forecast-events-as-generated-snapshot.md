# Keep forecast events as a generated snapshot

**Status:** Accepted

## Context

Forecast events are maintained in a Google spreadsheet, while the application
has no first-party backend. The forecast page currently reads a checked-in
TypeScript dataset generated from the sheet's published CSV output.

## Decision

Keep Google Sheets as the event-editing source, and keep the website's runtime
event data as a generated, checked-in snapshot. GitHub Actions runs the sync
weekly or on manual dispatch, and commits the generated dataset when it
changes. The browser does not fetch the spreadsheet directly.

## Consequences

- Forecast event lookups use data bundled with the application and do not
  depend on Google Sheets being available to each visitor.
- Spreadsheet edits are not immediately visible. They must be picked up by a
  successful sync and then included in a deployed build.
- The published CSV must remain accessible to the sync workflow, and the
  spreadsheet should contain only event information suitable for inclusion in
  the public application.
- The importer depends on a stable CSV layout. Its current expected columns
  differ from the layout described in `.env.example`; reconcile that
  documentation separately.

## References

- [Data sources and API behavior](../DATA-SOURCES-AND-APIS.md#in-repo-datasets)
- [Forecast event sync script](../../scripts/sync-forecast-events.mjs)
- [Forecast event sync workflow](../../.github/workflows/sync-forecast-events.yml)
- [Generated forecast event dataset](../../src/features/forecast/forecastEvents.ts)

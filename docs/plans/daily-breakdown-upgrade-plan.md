# Daily Breakdown — View Mode Upgrade Implementation Plan

## Overview

Upgrade the **Daily Breakdown** section of the weather forecast UI to support two interchangeable view layouts. Users can toggle between views using a style pill in the section header. Their preference is persisted via the existing Zustand + `localStorage` setup.

---

## 1. Goals

- Replace the current fixed 2-column card grid with two user-selectable view modes.
- **View A — Compact Table:** All days shown as rows in a dense data table; rows expand inline for detail.
- **View B — Single Day Panel:** One day shown in full detail at a time; a day picker strip allows navigation.
- Add a two-button style pill to the `Daily Breakdown` section header (right-aligned) to toggle between views.
- Persist the user's view preference using the existing Zustand store with `persist` middleware.

---

## 2. Zustand Store Changes

### 2.1 Add preference key

In the existing persisted Zustand store (wherever weather or UI preferences are kept), add a new key:

```ts
dailyBreakdownView: 'table' | 'single-day'
```

Default value: `'table'`

### 2.2 Add setter action

```ts
setDailyBreakdownView: (view: 'table' | 'single-day') => void
```

### 2.3 Ensure persistence

Confirm the `dailyBreakdownView` key is included in the `partialize` config (or equivalent) of the `persist` middleware so it is saved to `localStorage`. If the store persists all keys by default, no change is needed here.

---

## 3. Section Header Changes

The `Daily Breakdown` section header currently renders just the title. Update it to include a right-aligned view toggle.

### 3.1 Layout

```
[ DAILY BREAKDOWN ]                    [ ▤ Table  |  ◫ Day View ]
```

- Left: existing title text (unchanged).
- Right: a pill-shaped toggle with two buttons.

### 3.2 Toggle Pill — Spec

- Pill container: rounded border (e.g. `border-radius: 999px`), subtle border, low-opacity background — matching the existing dark UI.
- Two buttons inside: `Table` (grid/table icon) and `Day View` (single panel icon).
- Active button: filled/highlighted background within the pill (e.g. slightly lighter bg + full-opacity text).
- Inactive button: ghost/muted style.
- On click: call `setDailyBreakdownView(...)` from the Zustand store.
- Read active state from `dailyBreakdownView` in the store.

### 3.3 Icons

Use existing icon library. Suggested icons:
- Table view: a grid or table icon (e.g. `TableIcon`, `LayoutGrid`)
- Day view: a single panel / columns icon (e.g. `LayoutTemplate`, `PanelTop`)

---

## 4. View A — Compact Table

Rendered when `dailyBreakdownView === 'table'`.

### 4.1 Table Structure

One row per forecast day. Columns:

| Column | Content |
|---|---|
| Date | e.g. `Mar 27` with calendar icon |
| High / Low | e.g. `14.1 / 4.6 °C` |
| Precipitation | e.g. `1.5 mm` with rain icon |
| Sunshine | e.g. `0 hrs` with sun icon |
| Daylight | e.g. `12.6 hrs` |
| Expand | Chevron icon button to expand the row |

### 4.2 Row Expand / Collapse

- Clicking the chevron (or anywhere on the row) toggles an expanded section directly below that row.
- The expanded section spans the full table width and displays the detail stats: `Avg Mean Temp`, `Rainfall`, `Snowfall`, `Total Precipitation`, `Max Wind Speed`.
- Only one row should be expanded at a time (accordion behaviour). Alternatively, allow multiple — choose whichever is more consistent with the rest of the app's patterns.
- The expanded row content should visually differentiate itself from the main rows (e.g. slightly different background, indented layout, or a sub-card style).
- Animate expand/collapse with a smooth height transition.

### 4.3 Table Styling

- Match the existing dark UI: dark background, muted borders, consistent typography.
- Header row: uppercase label style, muted text color, matching existing section label treatment.
- Alternating row backgrounds or subtle dividers for readability.
- Responsive: on narrow screens, consider hiding lower-priority columns (`Sunshine`, `Daylight`) or collapsing to a 2-line row layout.

---

## 5. View B — Single Day Panel + Day Picker Strip

Rendered when `dailyBreakdownView === 'single-day'`.

### 5.1 Layout

```
[ Day Picker Strip — all days as chips ]
[                                       ]
[   Full Detail Panel for selected day  ]
[                                       ]
```

### 5.2 Day Picker Strip

- Horizontal row of day chips, one per forecast day.
- Each chip shows: short day name (e.g. `Thu`) + date (e.g. `Mar 27`).
- Active chip: highlighted (filled bg, full-opacity text). Matches existing accent/active styles in the app.
- Inactive chips: ghost/muted.
- Strip scrolls horizontally if there are more days than fit the viewport.
- Clicking a chip sets that day as the selected day (local state, does not need to be persisted).
- Default selected day on mount: the first day in the forecast data, or today if present.

### 5.3 Full Detail Panel

Displays all available stats for the selected day in a spacious, full-width layout:

**Primary stats row (4 columns):**
- High / Low
- Precipitation
- Sunshine
- Daylight

**Secondary stats row (displayed below, always visible — no expand needed since only one day is shown):**
- Avg Mean Temp
- Rainfall
- Snowfall
- Total Precipitation
- Max Wind Speed

Use a card or panel container matching the existing dark card styles. Stats can use the same icon + label + value pattern already present in the existing card tiles, but with more generous spacing since there is only one day to display.

### 5.4 Day Navigation

Optionally add previous/next arrow buttons flanking the day picker strip (or at the edges of the panel) for keyboard-friendly and mouse navigation between days.

---

## 6. Component Structure

Suggested file layout (adapt to your existing project structure):

```
components/
  weather/
    DailyBreakdown/
      index.tsx                  ← parent; reads store, renders header + active view
      DailyBreakdownHeader.tsx   ← title + view toggle pill
      ViewTogglePill.tsx         ← the two-button pill component
      TableView/
        index.tsx
        DayRow.tsx               ← single row + expandable detail
        ExpandedDetail.tsx       ← expanded row content
      SingleDayView/
        index.tsx
        DayPickerStrip.tsx
        DayDetailPanel.tsx
```

If the existing codebase uses a flat component structure, adapt accordingly. The key separation is: **header**, **table view**, and **single day view** as distinct units.

---

## 7. Data / Props

The `DailyBreakdown` parent component likely already receives forecast day data as props or reads it from a store/context. No changes to the data fetching layer are required. Both views consume the same data shape.

Ensure the day data type includes all fields used in the expanded/detail views:
- `date` (string or Date)
- `highTemp`, `lowTemp`
- `precipitation`
- `sunshine`
- `daylight`
- `avgMeanTemp`
- `rainfall`
- `snowfall`
- `totalPrecipitation`
- `maxWindSpeed`

If any of these are missing from the current type, add them.

---

## 8. Behaviour & Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| User has no stored preference | Default to `'table'` view |
| `localStorage` is unavailable | Fall back to default silently |
| Only 1 forecast day available | Both views work; day picker strip shows a single chip |
| Very many forecast days (14+) | Table scrolls naturally; day picker strip scrolls horizontally |
| No detail data for a day | Expanded row / detail panel shows `—` or `N/A` for missing fields |
| View toggle clicked rapidly | Transition between views should not cause layout jank; use a simple conditional render |

---

## 9. Acceptance Criteria

- [ ] Style pill renders in the `Daily Breakdown` section header, right-aligned.
- [ ] Pill correctly reflects the active view from the Zustand store.
- [ ] Clicking a pill button updates the store and switches the rendered view.
- [ ] Refreshing the page restores the previously selected view (persisted via `localStorage`).
- [ ] **Table View:** All forecast days appear as rows; row expand/collapse works with animation; detail stats are correct.
- [ ] **Single Day View:** Day picker strip renders all days; clicking a chip updates the detail panel; default chip is the first day.
- [ ] Both views are visually consistent with the existing dark UI system.
- [ ] No regressions to other parts of the weather UI.

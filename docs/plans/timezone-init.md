# Timezone Converter — Implementation Plan

## Context & Constraints

- A **Zustand store already exists** in this project with `persist` middleware serializing to `localStorage`.
- **Do not modify or remove any existing store slices, keys, or middleware configuration.**
- All new state should be **added alongside** existing state within the same `persist` call, or in a separate dedicated store if the existing store is in a different domain.
- The `localStorage` key name currently in use must not change.

---

## Tech Stack

- **React** (existing)
- **Zustand** with `persist` middleware (existing — do not alter)
- **Luxon** (`luxon`) — add as a new dependency if not already installed
- **Tailwind CSS** (assumed existing — adjust if not)

Install if needed:
```bash
npm install luxon
npm install --save-dev @types/luxon  # if using TypeScript
```

---

## 1. Timezone Data Utilities

Create a file at `src/utils/timezones.ts` (or `.js`).

This module is **pure utility** — no store interaction, no side effects.

### 1a. Build the Timezone Option List

Use the browser's `Intl` API to get all valid IANA timezone identifiers. Use Luxon's `DateTime` to enrich each entry with a formatted UTC offset and numeric offset for sorting.

```ts
import { DateTime } from 'luxon';

export interface TimezoneOption {
  tz: string;           // IANA key, e.g. "America/New_York"
  label: string;        // Human-readable, e.g. "America/New York"
  offset: string;       // Formatted, e.g. "UTC-05:00"
  offsetMinutes: number; // Numeric, e.g. -300 — used for sorting
}

export function buildTimezoneOptions(): TimezoneOption[] {
  const zones = Intl.supportedValuesOf('timeZone');

  const options = zones.map((tz) => {
    const dt = DateTime.now().setZone(tz);
    return {
      tz,
      label: tz.replace(/_/g, ' '),
      offset: `UTC${dt.toFormat('ZZ')}`,
      offsetMinutes: dt.offset,
    };
  });

  return options.sort((a, b) => a.offsetMinutes - b.offsetMinutes);
}
```

Call `buildTimezoneOptions()` once at app startup and memoize the result — it does not need to be called on every render.

### 1b. Clock Display Data Derivation

Given a Luxon `DateTime` (`now`) and a timezone string, return all formatted display values needed to render a clock card.

```ts
export interface ClockDisplayData {
  time24: string;       // "14:45:30"
  time12: string;       // "02:45:30 PM"
  timeCompact: string;  // "14:45"
  date: string;         // "Mon, Mar 23"
  utcLabel: string;     // "UTC+05:30"
  offsetMinutes: number;
  hourDeg: number;      // Analog clock hand degrees
  minuteDeg: number;
  secondDeg: number;
}

export function getClockDisplayData(now: DateTime, tz: string): ClockDisplayData {
  const dt = now.setZone(tz);

  const h = dt.hour % 12;
  const m = dt.minute;
  const s = dt.second;

  return {
    time24:       dt.toFormat('HH:mm:ss'),
    time12:       dt.toFormat('hh:mm:ss a'),
    timeCompact:  dt.toFormat('HH:mm'),
    date:         dt.toFormat('ccc, LLL dd'),
    utcLabel:     `UTC${dt.toFormat('ZZ')}`,
    offsetMinutes: dt.offset,
    hourDeg:   h * 30 + m * 0.5,
    minuteDeg: m * 6  + s * 0.1,
    secondDeg: s * 6,
  };
}
```

---

## 2. Zustand Store — New Slice Only

> ⚠️ **Do not touch existing store code.** Add the following fields and actions only.

The new state slice to add inside the existing `persist` store (or a new store if domain separation is preferred):

### New State Shape

```ts
// Types — define in src/types/timezone.ts or alongside the store

export type DisplayMode  = 'analog' | 'digital';
export type DetailLevel  = 'compact' | 'detailed';

export interface TrackedZone {
  id: string;           // Unique ID, e.g. nanoid() or crypto.randomUUID()
  tz: string;           // IANA timezone string
  label: string;        // User-editable display name
  order: number;        // Position in the list (0-indexed)
  displayMode: DisplayMode;
  detailLevel: DetailLevel;
  showUTC: boolean;
  showDate: boolean;
  showSeconds: boolean;
}

export interface TimezoneStoreSlice {
  localTz: string;
  trackedZones: TrackedZone[];

  // Actions
  setLocalTz:     (tz: string) => void;
  addZone:        (zone: TrackedZone) => void;
  removeZone:     (id: string) => void;
  updateZone:     (id: string, patch: Partial<TrackedZone>) => void;
  reorderZones:   (orderedIds: string[]) => void;
}
```

### New Actions to Add

```ts
setLocalTz: (tz) => set({ localTz: tz }),

addZone: (zone) =>
  set((s) => ({ trackedZones: [...s.trackedZones, zone] })),

removeZone: (id) =>
  set((s) => ({ trackedZones: s.trackedZones.filter((z) => z.id !== id) })),

updateZone: (id, patch) =>
  set((s) => ({
    trackedZones: s.trackedZones.map((z) =>
      z.id === id ? { ...z, ...patch } : z
    ),
  })),

reorderZones: (orderedIds) =>
  set((s) => ({
    trackedZones: orderedIds.map((id, i) => ({
      ...s.trackedZones.find((z) => z.id === id)!,
      order: i,
    })),
  })),
```

### Default Initial State

```ts
localTz: Intl.DateTimeFormat().resolvedOptions().timeZone, // auto-detect user's zone
trackedZones: [],
```

---

## 3. Clock Tick — Shared Time Source

Create a custom hook at `src/hooks/useClockTick.ts`.

This provides a single `DateTime` that updates every second and is shared across all clock cards. Do **not** create an interval per clock card.

```ts
import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';

export function useClockTick(): DateTime {
  const [now, setNow] = useState(() => DateTime.now());

  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
```

Use this hook once at the page/layout level and pass `now` down via props or a lightweight context — do not call it inside each clock card.

---

## 4. Component Architecture

```
<TimezonePage>
  ├── useClockTick()                    ← single tick, shared
  ├── <TimezoneNavbar>                  ← local timezone selector
  │     └── <TimezoneSelect>            ← searchable dropdown from buildTimezoneOptions()
  │           └── [Config Button]       ← opens modal
  ├── <ClockGrid>                       ← renders sorted trackedZones
  │     └── <ClockCard zone={zone} now={now}>
  │           ├── <AnalogClock>         ← rendered if displayMode === 'analog'
  │           └── <DigitalClock>        ← rendered if displayMode === 'digital'
  └── <ConfigModal>                     ← reads/writes store
        ├── <ZoneList>                  ← draggable, reorderable
        │     └── <ZoneConfigRow>       ← per-zone settings
        └── [Add Timezone Button]
```

---

## 5. Component Implementation Notes

### `<TimezoneNavbar>`

- On mount, call `buildTimezoneOptions()` once and store result in local state or a module-level constant.
- Render a searchable `<select>` or combobox.
- On change, call `setLocalTz(tz)` from the store.
- The config button lives here and toggles `<ConfigModal>` open/closed via local `useState`.

### `<ClockCard>`

- Accepts `zone: TrackedZone` and `now: DateTime` as props.
- Calls `getClockDisplayData(now, zone.tz)` on every render.
- Conditionally renders fields based on `zone.detailLevel`, `zone.showUTC`, `zone.showDate`, `zone.showSeconds`.
- Switches between `<AnalogClock>` and `<DigitalClock>` based on `zone.displayMode`.

### `<AnalogClock>`

- Accepts `hourDeg`, `minuteDeg`, `secondDeg` as props.
- Implemented with CSS `transform: rotate(Xdeg)` on SVG or `<div>` hands.
- Uses `transition: transform 0.2s` for smooth hand movement (skip transition when second hand wraps 354° → 0°).

### `<DigitalClock>`

- Renders time string based on `detailLevel`:
  - `detailed` → `time12` or `time24` with seconds
  - `compact` → `timeCompact` without seconds
- Conditionally renders `utcLabel` and `date` lines below.

### `<ConfigModal>`

- Reads `trackedZones` from store (already sorted by `order`).
- Renders a draggable list (use `@dnd-kit/core` or `react-beautiful-dnd`).
- On drag end, call `reorderZones(newOrderedIds)`.
- Each row has:
  - Editable label (`updateZone(id, { label })`)
  - Display mode toggle: Analog / Digital
  - Detail level toggle: Compact / Detailed
  - Checkboxes: Show UTC, Show Date, Show Seconds
  - Remove button (`removeZone(id)`)
- "Add Timezone" opens a secondary `<TimezoneSelect>` that calls `addZone(newZone)` on confirm.

---

## 6. New Zone Default Factory

Create a helper to produce a well-typed default `TrackedZone` when the user adds one:

```ts
export function createTrackedZone(tz: string, label: string, order: number): TrackedZone {
  return {
    id: crypto.randomUUID(),
    tz,
    label,
    order,
    displayMode: 'digital',
    detailLevel: 'detailed',
    showUTC: true,
    showDate: true,
    showSeconds: false,
  };
}
```

---

## 7. File Structure Summary

```
src/
├── hooks/
│   └── useClockTick.ts          ← new
├── utils/
│   └── timezones.ts             ← new
├── types/
│   └── timezone.ts              ← new
├── store/
│   └── [existing store file]    ← add slice only, do not alter existing code
├── components/
│   ├── TimezoneNavbar.tsx        ← new
│   ├── TimezoneSelect.tsx        ← new
│   ├── ClockGrid.tsx             ← new
│   ├── ClockCard.tsx             ← new
│   ├── AnalogClock.tsx           ← new
│   ├── DigitalClock.tsx          ← new
│   └── ConfigModal/
│       ├── ConfigModal.tsx       ← new
│       ├── ZoneList.tsx          ← new
│       └── ZoneConfigRow.tsx     ← new
└── pages/ (or app/)
    └── TimezonePage.tsx          ← new (or integrate into existing layout)
```

---

## 8. Key Invariants to Preserve

- The `persist` middleware and its `localStorage` key must not be renamed or reconfigured.
- All existing store slices must remain untouched.
- `buildTimezoneOptions()` should be called **once** at startup, not on every render.
- `useClockTick()` should be instantiated **once** at the page level, not inside individual cards.
- `trackedZones` should always be rendered sorted by the `order` field: `[...trackedZones].sort((a, b) => a.order - b.order)`.
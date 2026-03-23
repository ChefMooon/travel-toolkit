import { beforeEach, describe, expect, it } from 'vitest';
import type { TrackedZone } from './timezoneStore';
import { useTimezoneStore } from './timezoneStore';

function makeZone(overrides: Partial<TrackedZone> = {}): TrackedZone {
  return {
    id: 'zone-1',
    tz: 'UTC',
    label: 'UTC',
    order: 0,
    displayMode: 'digital',
    detailLevel: 'detailed',
    showUTC: true,
    showDate: true,
    showSeconds: false,
    ...overrides,
  };
}

describe('timezoneStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimezoneStore.setState({
      localTz: 'UTC',
      trackedZones: [],
    });
  });

  it('updates local timezone', () => {
    useTimezoneStore.getState().setLocalTz('America/New_York');

    expect(useTimezoneStore.getState().localTz).toBe('America/New_York');
  });

  it('adds and removes zones by id', () => {
    const zoneA = makeZone({ id: 'a', tz: 'Europe/London', label: 'London', order: 0 });
    const zoneB = makeZone({ id: 'b', tz: 'Asia/Tokyo', label: 'Tokyo', order: 1 });

    useTimezoneStore.getState().addZone(zoneA);
    useTimezoneStore.getState().addZone(zoneB);

    expect(useTimezoneStore.getState().trackedZones.map((z) => z.id)).toEqual(['a', 'b']);

    useTimezoneStore.getState().removeZone('a');

    expect(useTimezoneStore.getState().trackedZones.map((z) => z.id)).toEqual(['b']);
  });

  it('patches only the targeted zone', () => {
    const zoneA = makeZone({ id: 'a', label: 'A', order: 0 });
    const zoneB = makeZone({ id: 'b', label: 'B', order: 1 });

    useTimezoneStore.setState({ trackedZones: [zoneA, zoneB] });

    useTimezoneStore.getState().updateZone('b', {
      label: 'Renamed B',
      displayMode: 'analog',
      showSeconds: true,
    });

    const [afterA, afterB] = useTimezoneStore.getState().trackedZones;

    expect(afterA).toMatchObject(zoneA);
    expect(afterB).toMatchObject({
      id: 'b',
      label: 'Renamed B',
      displayMode: 'analog',
      showSeconds: true,
      order: 1,
    });
  });

  it('reorders zones and rewrites order indices', () => {
    useTimezoneStore.setState({
      trackedZones: [
        makeZone({ id: 'a', order: 0 }),
        makeZone({ id: 'b', order: 1 }),
        makeZone({ id: 'c', order: 2 }),
      ],
    });

    useTimezoneStore.getState().reorderZones(['c', 'a', 'b']);

    const zones = useTimezoneStore.getState().trackedZones;

    expect(zones.map((z) => z.id)).toEqual(['c', 'a', 'b']);
    expect(zones.map((z) => z.order)).toEqual([0, 1, 2]);
  });

  it('ignores unknown ids during reorder', () => {
    useTimezoneStore.setState({
      trackedZones: [
        makeZone({ id: 'a', order: 0 }),
        makeZone({ id: 'b', order: 1 }),
      ],
    });

    useTimezoneStore.getState().reorderZones(['missing', 'b', 'a']);

    const zones = useTimezoneStore.getState().trackedZones;

    expect(zones.map((z) => z.id)).toEqual(['b', 'a']);
    expect(zones.map((z) => z.order)).toEqual([0, 1]);
  });
});

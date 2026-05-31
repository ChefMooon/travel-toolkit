import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DisplayMode = 'analog' | 'digital';
export type DetailLevel = 'compact' | 'detailed';

export interface TrackedZone {
  id: string;
  tz: string;
  label: string;
  order: number;
  displayMode: DisplayMode;
  detailLevel: DetailLevel;
  showUTC: boolean;
  showDate: boolean;
  showSeconds: boolean;
}

interface TimezoneStore {
  localTz: string;
  trackedZones: TrackedZone[];
  setLocalTz: (tz: string) => void;
  addZone: (zone: TrackedZone) => void;
  removeZone: (id: string) => void;
  updateZone: (id: string, patch: Partial<TrackedZone>) => void;
  reorderZones: (orderedIds: string[]) => void;
}

export const useTimezoneStore = create<TimezoneStore>()(
  persist(
    (set) => ({
      localTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      trackedZones: [],
      setLocalTz: (tz) => set({ localTz: tz }),
      addZone: (zone) =>
        set((state) => ({ trackedZones: [...state.trackedZones, zone] })),
      removeZone: (id) =>
        set((state) => ({
          trackedZones: state.trackedZones.filter((zone) => zone.id !== id),
        })),
      updateZone: (id, patch) =>
        set((state) => ({
          trackedZones: state.trackedZones.map((zone) =>
            zone.id === id ? { ...zone, ...patch } : zone
          ),
        })),
      reorderZones: (orderedIds) =>
        set((state) => {
          const matchedZones = orderedIds
            .map((id) => state.trackedZones.find((entry) => entry.id === id))
            .filter((zone): zone is TrackedZone => zone !== undefined);

          const reordered = matchedZones.map((zone, index) => ({
            ...zone,
            order: index,
          }));

          return { trackedZones: reordered };
        }),
    }),
    { name: 'travel-toolkit-timezone-data' }
  )
);

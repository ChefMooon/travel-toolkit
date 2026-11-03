import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getTripSaveStatus, useSaveSlotStore, type TripSaveStatus } from './saveSlotStore';
import { useTripStore } from './tripStore';
import type { TripSnapshot } from './types';

type WorkContent = Pick<TripSnapshot, 'couples' | 'costs' | 'nonPayingTravellers'>;

// isDirty resets on reload, so a trip that differs from its slot still counts as unsaved work,
// and an unsaved trip with content counts even when nothing changed this session.
export function hasUnsavedWork(status: TripSaveStatus, snapshot: WorkContent, isDirty: boolean): boolean {
  if (status.type === 'unsaved-changes') return true;
  if (status.type === 'saved') return false;
  return isDirty || snapshot.couples.length > 0 || snapshot.costs.length > 0 || snapshot.nonPayingTravellers.length > 0;
}

export interface TripSaveStatusResult {
  status: TripSaveStatus;
  /** Index of the slot holding the live trip ID, or -1 when the trip is not saved. */
  homeSlotIndex: number;
  hasUnsavedWork: boolean;
}

export function useTripSaveStatus(): TripSaveStatusResult {
  const snapshot = useTripStore(
    useShallow((state): TripSnapshot => ({
      tripId: state.tripId,
      tripName: state.tripName,
      globalMarkup: state.globalMarkup,
      couples: state.couples,
      nonPayingTravellers: state.nonPayingTravellers,
      costs: state.costs,
      exchangeRates: state.exchangeRates,
      region: state.region,
      targetCurrency: state.targetCurrency,
      tripStartDate: state.tripStartDate,
      tripEndDate: state.tripEndDate,
    }))
  );
  const isDirty = useTripStore((state) => state.isDirty);
  const slots = useSaveSlotStore((state) => state.slots);

  // Only slots sharing the live trip ID are serialized by getTripSaveStatus, so this stays cheap.
  return useMemo(() => {
    const status = getTripSaveStatus(slots, snapshot, isDirty);
    return {
      status,
      homeSlotIndex: status.type === 'not-saved' ? -1 : status.slotIndex,
      hasUnsavedWork: hasUnsavedWork(status, snapshot, isDirty),
    };
  }, [slots, snapshot, isDirty]);
}

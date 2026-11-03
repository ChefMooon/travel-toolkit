import { useTripStore } from './tripStore';

// In-memory only (never persisted): remembers that the last import brought in a trip whose ID is
// already stored in a slot, so saving it would silently replace that slot's version.
// Set by the import flow (useImportTrip). Quick save (saveActions) asks for confirmation once while
// this matches the live trip; any save clears it, and so does any later change of trip identity
// (load, new trip, trip ID edit), watched below.
let guardedTripId: string | null = null;
let stopWatchingTrip: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

// Subscribed lazily (only while guarding) so importing this module never touches the trip store.
function watchTripIdentity() {
  stopWatchingTrip?.();
  const { tripIdentityRevision } = useTripStore.getState();
  stopWatchingTrip = useTripStore.subscribe((state) => {
    if (state.tripIdentityRevision !== tripIdentityRevision) clearImportedTripGuard();
  });
}

export function markImportedTripMatchesSlot(tripId: string): void {
  if (guardedTripId === tripId) return;
  guardedTripId = tripId;
  watchTripIdentity();
  emit();
}

export function clearImportedTripGuard(): void {
  if (guardedTripId === null) return;
  guardedTripId = null;
  stopWatchingTrip?.();
  stopWatchingTrip = null;
  emit();
}

export function getImportedTripGuard(): string | null {
  return guardedTripId;
}

/** True only while the live trip is the imported trip that matched a stored slot. */
export function shouldConfirmFirstSave(tripId: string): boolean {
  return guardedTripId !== null && guardedTripId === tripId;
}

export function subscribeImportedTripGuard(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

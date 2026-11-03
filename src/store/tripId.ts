// Kept free of store imports so tripStore and saveSlotStore can both use it without a cycle.

export function generateTripId(): string {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

export function generateUniqueTripId(taken: Iterable<string>, maxAttempts = 50): string {
  const takenIds = new Set(taken);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tripId = generateTripId();
    if (!takenIds.has(tripId)) {
      return tripId;
    }
  }
  throw new Error(`Unable to generate a unique trip ID after ${maxAttempts} attempts.`);
}

/** Convert the existing validation copy into a locale-aware catalog key. */
export function dateDraftErrorKey(message: string):
  | 'dateStartInvalid'
  | 'dateEndInvalid'
  | 'dateStartRequired'
  | 'dateOrderInvalid'
  | null {
  switch (message) {
    case 'Enter a valid trip start date in YYYY-MM-DD format.': return 'dateStartInvalid';
    case 'Enter a valid trip end date in YYYY-MM-DD format.': return 'dateEndInvalid';
    case 'Choose a trip start date before the end date.': return 'dateStartRequired';
    case 'End date must be on or after the start date.': return 'dateOrderInvalid';
    default: return null;
  }
}

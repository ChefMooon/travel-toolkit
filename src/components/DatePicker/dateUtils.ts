export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= monthLengths[month - 1]!;
}

export function getDateDraftError(start: string, end: string): string {
  if (start && !isValidDateOnly(start)) return 'Enter a valid trip start date in YYYY-MM-DD format.';
  if (end && !isValidDateOnly(end)) return 'Enter a valid trip end date in YYYY-MM-DD format.';
  if (end && !start) return 'Choose a trip start date before the end date.';
  if (start && end && end < start) return 'End date must be on or after the start date.';
  return '';
}

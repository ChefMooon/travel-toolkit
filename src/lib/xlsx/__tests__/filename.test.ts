import { describe, expect, it, vi } from 'vitest';
const { mockWriteFile } = vi.hoisted(() => ({ mockWriteFile: vi.fn() }));
vi.mock('xlsx', async (importOriginal) => ({ ...(await importOriginal<typeof import('xlsx')>()), writeFile: mockWriteFile }));
import type { TripSnapshot } from '@/store/types';
import { exportWorkbook } from '../exportWorkbook';
import { buildExportFilename, sanitizeFilename } from '../filename';
import type { ExportOptions } from '../types';

const snapshot: TripSnapshot = {
  tripId: '123456',
  tripName: 'Lisbon & Porto',
  globalMarkup: 0,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
  region: 'Europe',
  targetCurrency: 'EUR',
};

const now = new Date(2026, 10, 3, 9, 30);

describe('buildExportFilename', () => {
  it.each([
    ['tripId', {}, '123456_2026-11-03.xlsx'],
    ['tripName', {}, 'Lisbon-&-Porto_2026-11-03.xlsx'],
    ['slotLabel', { slotLabel: 'Slot 2' }, 'Slot-2_2026-11-03.xlsx'],
    ['custom', { customName: 'my trip' }, 'my-trip_2026-11-03.xlsx'],
    ['custom', { customName: '   ' }, '123456_2026-11-03.xlsx'],
    ['slotLabel', {}, '123456_2026-11-03.xlsx'],
  ] as const)('uses the %s preset (%j)', (namePreset, extra, expected) => {
    expect(buildExportFilename(snapshot, { namePreset, ...extra }, now)).toBe(expected);
  });

  it('omits the date when includeDate is false and falls back to trip-export', () => {
    expect(buildExportFilename(snapshot, { namePreset: 'tripId', includeDate: false }, now)).toBe('123456.xlsx');
    expect(buildExportFilename({ tripId: '', tripName: '' }, { namePreset: 'tripName', includeDate: false }, now)).toBe('trip-export.xlsx');
  });
});

describe('sanitizeFilename', () => {
  it('strips reserved characters, collapses whitespace and dashes, trims and caps at 60', () => {
    expect(sanitizeFilename(' a<b>:c"/d\\e|f?g*h ')).toBe('abcdefgh');
    expect(sanitizeFilename('a  b -- c')).toBe('a-b-c');
    expect(sanitizeFilename('-x-')).toBe('x');
    expect(sanitizeFilename('x'.repeat(80))).toHaveLength(60);
  });
});

describe('exportWorkbook file name', () => {
  it('writes the same name buildExportFilename previews for the same options and time', async () => {
    mockWriteFile.mockReset();
    const options: ExportOptions = {
      schema: 'single-sheet', source: { type: 'active' }, namePreset: 'custom', customName: 'Summer plan', includeDate: true,
    };
    await exportWorkbook(snapshot, options, now);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockWriteFile.mock.calls[0]?.[1]).toBe(buildExportFilename(snapshot, options, now));
    expect(mockWriteFile.mock.calls[0]?.[1]).toBe('Summer-plan_2026-11-03.xlsx');
  });
});

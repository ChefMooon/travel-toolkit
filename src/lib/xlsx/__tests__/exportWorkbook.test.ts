import { describe, it, expect } from 'vitest';
import type { TripSnapshot } from '@/store/types';
import { buildSingleSheet } from '../singleSheetBuilder';
import { buildThreeSheet } from '../threeSheetBuilder';
import { parseSingleSheet } from '../singleSheetParser';
import { parseThreeSheet } from '../threeSheetParser';
import { XLSX_SCHEMA_VERSION } from '../types';
import * as XLSX from 'xlsx';

function makeSnapshot(): TripSnapshot {
  return {
    tripId: '123456',
    tripName: 'Test Trip',
    globalMarkup: 50,
    region: 'Europe',
    targetCurrency: 'EUR',
    couples: [
      { id: 'c1', name: 'Alice & Bob', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
      { id: 'c2', name: 'Carol & Dave', colorIndex: 2, iconIndex: 2, sortOrder: 1 },
    ],
    nonPayingTravellers: [
      { id: 'n1', label: 'Little Timmy', coupleId: 'c1' },
    ],
    costs: [
      {
        id: 'cost1',
        name: 'Hotel',
        currency: 'EUR',
        value: 200,
        markupOverride: null,
        splitType: 'shared',
        assignedCoupleIds: [],
        sortOrder: 0,
        type: 'accommodation',
      },
      {
        id: 'cost2',
        name: 'Train tickets',
        currency: 'GBP',
        value: 80,
        markupOverride: 10,
        splitType: 'subset',
        assignedCoupleIds: ['c1'],
        sortOrder: 1,
        type: 'trains',
      },
    ],
    exchangeRates: [
      { currency: 'EUR', rateToUSD: 1.1, isOverridden: false },
      { currency: 'GBP', rateToUSD: 1.3, isOverridden: true },
    ],
  };
}

describe('Single-sheet builder (v1)', () => {
  it('creates a workbook with one sheet named "Trip"', () => {
    const wb = buildSingleSheet(makeSnapshot(), XLSX);
    expect(wb.SheetNames).toEqual(['Trip']);
  });

  it('has schema version marker at A2', () => {
    const wb = buildSingleSheet(makeSnapshot(), XLSX);
    const sheet = wb.Sheets['Trip']!;
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    expect(aoa[1]?.[0]).toBe('schema');
    expect(aoa[1]?.[1]).toBe(XLSX_SCHEMA_VERSION);
  });

  it('exports trip metadata in fixed positions', () => {
    const wb = buildSingleSheet(makeSnapshot(), XLSX);
    const sheet = wb.Sheets['Trip']!;
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    expect(aoa[2]?.[1]).toBe('123456');       // Trip ID
    expect(aoa[3]?.[1]).toBe('Test Trip');     // Trip Name
    expect(aoa[4]?.[1]).toBe(50);             // Global Markup
    expect(aoa[5]?.[1]).toBe('Europe');       // Region
    expect(aoa[6]?.[1]).toBe('EUR');          // Target Currency
  });

  it('exports cost ledger starting at column L', () => {
    const wb = buildSingleSheet(makeSnapshot(), XLSX);
    const sheet = wb.Sheets['Trip']!;
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // L1 header label
    expect(aoa[0]?.[11]).toBe('Cost Ledger');
    // L2 = header row
    expect(aoa[1]?.[11]).toBe('Name');
    // L3 = first cost
    expect(aoa[2]?.[11]).toBe('Hotel');
    expect(aoa[2]?.[13]).toBe(200);
    // L4 = second cost
    expect(aoa[3]?.[11]).toBe('Train tickets');
  });

  it('exports party and exchange rates sections', () => {
    const wb = buildSingleSheet(makeSnapshot(), XLSX);
    const sheet = wb.Sheets['Trip']!;
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    expect(aoa[0]?.[3]).toBe('Travelling Party');
    expect(aoa[0]?.[8]).toBe('Non-Paying Travellers');
    expect(aoa[0]?.[19]).toBe('Exchange Rates');
  });
});

describe('Three-sheet builder (v2)', () => {
  it('creates a workbook with Summary, Costs, and Party sheets', () => {
    const wb = buildThreeSheet(makeSnapshot(), XLSX);
    expect(wb.SheetNames).toEqual(['Summary', 'Costs', 'Party']);
  });

  it('has schema version marker in Summary', () => {
    const wb = buildThreeSheet(makeSnapshot(), XLSX);
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets['Summary']!, { header: 1, defval: null });
    expect(aoa[0]?.[0]).toBe('schema');
    expect(aoa[0]?.[1]).toBe(XLSX_SCHEMA_VERSION);
  });

  it('exports cost rows in Costs sheet', () => {
    const wb = buildThreeSheet(makeSnapshot(), XLSX);
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets['Costs']!, { header: 1, defval: null });
    expect(aoa[0]?.[0]).toBe('Name'); // header
    expect(aoa[1]?.[0]).toBe('Hotel');
    expect(aoa[2]?.[0]).toBe('Train tickets');
  });

  it('exports couple and NPT data in Party sheet', () => {
    const wb = buildThreeSheet(makeSnapshot(), XLSX);
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets['Party']!, { header: 1, defval: null });
    expect(aoa[0]?.[0]).toBe('Couples');
    expect(aoa[2]?.[0]).toBe('Alice & Bob');
    expect(aoa[3]?.[0]).toBe('Carol & Dave');

    const nptRow = aoa.findIndex((row) => row?.[0] === 'Non-Paying Travellers');
    expect(nptRow).toBeGreaterThan(0);
    expect(aoa[nptRow + 2]?.[0]).toBe('Little Timmy');
  });
});

describe('Round-trip: v1 export → import', () => {
  it('preserves trip data through export/import cycle', () => {
    const original = makeSnapshot();
    const exportable = original;

    const wb = buildSingleSheet(exportable, XLSX);
    const sheet = wb.Sheets['Trip']!;
    const parsed = parseSingleSheet(sheet, XLSX);

    // Metadata
    expect(parsed.tripId).toBe('123456');
    expect(parsed.tripName).toBe('Test Trip');
    expect(parsed.globalMarkup).toBe(50);
    expect(parsed.region).toBe('Europe');
    expect(parsed.targetCurrency).toBe('EUR');

    // Couples
    expect(parsed.couples).toHaveLength(2);
    expect(parsed.couples![0]!.name).toBe('Alice & Bob');

    // Costs
    expect(parsed.costs).toHaveLength(2);
    expect(parsed.costs![0]!.name).toBe('Hotel');
    expect(parsed.costs![0]!.value).toBe(200);

    // NPTs
    expect(parsed.nonPayingTravellers).toHaveLength(1);
    expect(parsed.nonPayingTravellers![0]!.label).toBe('Little Timmy');

    // Exchange rates
    expect(parsed.exchangeRates).toHaveLength(2);
    expect(parsed.exchangeRates![0]!.currency).toBe('EUR');
  });
});

describe('Round-trip: v2 export → import', () => {
  it('preserves trip data through export/import cycle', () => {
    const original = makeSnapshot();
    const exportable = original;

    const wb = buildThreeSheet(exportable, XLSX);
    const parsed = parseThreeSheet(wb, XLSX);

    expect(parsed.tripId).toBe('123456');
    expect(parsed.tripName).toBe('Test Trip');
    expect(parsed.couples).toHaveLength(2);
    expect(parsed.costs).toHaveLength(2);
    expect(parsed.nonPayingTravellers).toHaveLength(1);
    expect(parsed.exchangeRates).toHaveLength(2);
  });
});

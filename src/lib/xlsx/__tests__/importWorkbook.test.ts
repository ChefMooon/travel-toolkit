import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { buildSingleSheet } from '../singleSheetBuilder';
import { buildThreeSheet } from '../threeSheetBuilder';
import { parseSingleSheet } from '../singleSheetParser';
import { validateImportedSnapshot, _resetIdCounter } from '../validate';
import { SHEET_SUMMARY, SHEET_COSTS, SHEET_PARTY } from '../constants';

beforeEach(() => {
  _resetIdCounter();
});

function makeExportable() {
  return {
    tripId: '654321',
    tripName: 'Import Test',
    globalMarkup: 40,
    region: 'Asia' as const,
    targetCurrency: 'JPY',
    couples: [
      { id: 'c1', name: 'Group A', colorIndex: 3, iconIndex: 5, sortOrder: 0 },
      { id: 'c2', name: 'Group B', colorIndex: 4, iconIndex: 6, sortOrder: 1 },
    ],
    nonPayingTravellers: [
      { id: 'n1', label: 'Child 1', coupleId: 'c1' },
    ],
    costs: [
      {
        id: 'x1',
        name: 'Sushi dinner',
        currency: 'JPY',
        value: 5000,
        markupOverride: null,
        splitType: 'shared' as const,
        assignedCoupleIds: [] as string[],
        sortOrder: 0,
        type: 'food',
      },
    ],
    exchangeRates: [
      { currency: 'JPY', rateToUSD: 0.0067, isOverridden: false },
    ],
  };
}

describe('Schema detection — three-sheet', () => {
  it('detects three-sheet format by sheet names', () => {
    const wb = buildThreeSheet(makeExportable(), XLSX);
    expect(wb.SheetNames).toContain(SHEET_SUMMARY);
    expect(wb.SheetNames).toContain(SHEET_COSTS);
    expect(wb.SheetNames).toContain(SHEET_PARTY);
  });
});

describe('Schema detection — marker-less fallback', () => {
  it('still parses a single-sheet workbook without explicit schema marker removed', () => {
    const wb = buildSingleSheet(makeExportable(), XLSX);
    const sheet = wb.Sheets['Trip']!;

    // Remove schema marker cell
    delete sheet['B2'];

    const raw = parseSingleSheet(sheet, XLSX);
    // Should still get some data
    expect(raw.tripName).toBe('Import Test');
  });
});

describe('Validation', () => {
  it('validates and generates IDs for imported data', () => {
    const warnings: string[] = [];
    const raw = makeExportable();
    const result = validateImportedSnapshot(raw, warnings);

    expect(result.tripId).toBe('654321');
    expect(result.tripName).toBe('Import Test');
    expect(result.couples).toHaveLength(2);
    // IDs should be regenerated
    expect(result.couples[0]!.id).not.toBe('c1');
    expect(result.costs[0]!.id).not.toBe('x1');
  });

  it('deduplicates couple names with number suffix', () => {
    const warnings: string[] = [];
    const result = validateImportedSnapshot({
      tripId: '111111',
      tripName: 'Dupe Test',
      globalMarkup: 66,
      region: 'Europe',
      targetCurrency: 'EUR',
      couples: [
        { id: 'a', name: 'Alpha', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
        { id: 'b', name: 'Alpha', colorIndex: 2, iconIndex: 2, sortOrder: 1 },
        { id: 'c', name: 'Alpha', colorIndex: 3, iconIndex: 3, sortOrder: 2 },
      ],
      nonPayingTravellers: [],
      costs: [],
      exchangeRates: [],
    }, warnings);

    const names = result.couples.map((c) => c.name);
    expect(names[0]).toBe('Alpha');
    expect(names[1]).toBe('Alpha 2');
    expect(names[2]).toBe('Alpha 3');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('rejects invalid trip IDs and generates a new one', () => {
    const warnings: string[] = [];
    const result = validateImportedSnapshot({
      tripId: 'bad',
      tripName: 'Bad ID',
      globalMarkup: 66,
      region: 'Europe',
      targetCurrency: 'EUR',
      couples: [],
      nonPayingTravellers: [],
      costs: [],
      exchangeRates: [],
    }, warnings);

    expect(result.tripId).toMatch(/^\d{6}$/);
    expect(result.tripId).not.toBe('bad');
  });

  it('enforces MAX_GROUPS limit', () => {
    const warnings: string[] = [];
    const manyCouples = Array.from({ length: 150 }, (_, i) => ({
      id: `c${i}`,
      name: `Group ${i}`,
      colorIndex: 1,
      iconIndex: 1,
      sortOrder: i,
    }));

    const result = validateImportedSnapshot({
      tripId: '222222',
      tripName: 'Big',
      globalMarkup: 66,
      region: 'Europe',
      targetCurrency: 'EUR',
      couples: manyCouples,
      nonPayingTravellers: [],
      costs: [],
      exchangeRates: [],
    }, warnings);

    expect(result.couples.length).toBeLessThanOrEqual(100);
    expect(warnings.some((w) => w.includes('truncated'))).toBe(true);
  });

  it('resolves cost couple assignments by name', () => {
    const warnings: string[] = [];
    const result = validateImportedSnapshot({
      tripId: '333333',
      tripName: 'Assign Test',
      globalMarkup: 66,
      region: 'Europe',
      targetCurrency: 'EUR',
      couples: [
        { id: 'orig1', name: 'Team One', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
      ],
      nonPayingTravellers: [],
      costs: [
        {
          id: 'x',
          name: 'Dinner',
          currency: 'EUR',
          value: 100,
          markupOverride: null,
          splitType: 'individual',
          assignedCoupleIds: ['Team One'],
          sortOrder: 0,
          type: null,
        },
      ],
      exchangeRates: [],
    }, warnings);

    // The cost should have the new generated ID for "Team One", not the name string
    expect(result.costs[0]!.assignedCoupleIds[0]).toBe(result.couples[0]!.id);
    expect(result.costs[0]!.assignedCoupleIds[0]).not.toBe('Team One');
  });

  it('warns on unresolved cost assignments', () => {
    const warnings: string[] = [];
    const result = validateImportedSnapshot({
      tripId: '444444',
      tripName: 'Unresolved',
      globalMarkup: 66,
      region: 'Europe',
      targetCurrency: 'EUR',
      couples: [],
      nonPayingTravellers: [],
      costs: [
        {
          id: 'x',
          name: 'Orphan cost',
          currency: 'EUR',
          value: 50,
          markupOverride: null,
          splitType: 'subset',
          assignedCoupleIds: ['nonexistent'],
          sortOrder: 0,
          type: null,
        },
      ],
      exchangeRates: [],
    }, warnings);

    expect(result.costs[0]!.assignedCoupleIds).toHaveLength(0);
    expect(warnings.some((w) => w.includes('unresolved'))).toBe(true);
  });
});

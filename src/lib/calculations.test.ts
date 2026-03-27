import { describe, expect, it } from 'vitest';
import {
  buildSummary,
  formatCurrency,
  getCostWithMarkup,
  getEffectiveMarkup,
  roundHalfUp,
  splitCost,
  validateCost,
} from '@/lib/calculations';
import type { CostEntry, Couple, ExchangeRate } from '@/store/types';

const couples: Couple[] = [
  { id: 'c1', name: 'Couple 1', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
  { id: 'c2', name: 'Couple 2', colorIndex: 2, iconIndex: 2, sortOrder: 1 },
  { id: 'c3', name: 'Couple 3', colorIndex: 3, iconIndex: 3, sortOrder: 2 },
];

function makeCost(overrides: Partial<CostEntry> = {}): CostEntry {
  return {
    id: 'cost',
    name: 'Sample',
    currency: 'USD',
    value: 100,
    markupOverride: null,
    splitType: 'shared',
    assignedCoupleIds: [],
    sortOrder: 0,
    ...overrides,
  };
}

describe('roundHalfUp', () => {
  it('CALC-RND-001 rounds half-up boundaries at 2 decimals', () => {
    expect(roundHalfUp(0.005)).toBe(0.01);
    expect(roundHalfUp(0.004)).toBe(0);
    expect(roundHalfUp(1.235)).toBe(1.24);
    expect(roundHalfUp(1.234)).toBe(1.23);
  });

  it('CALC-RND-002 supports custom decimal precision', () => {
    expect(roundHalfUp(1.2345, 3)).toBe(1.235);
    expect(roundHalfUp(1.2344, 3)).toBe(1.234);
    expect(roundHalfUp(9.5, 0)).toBe(10);
  });
});

describe('validateCost', () => {
  it('CALC-VAL-001 validates shared cost', () => {
    const result = validateCost(makeCost({ splitType: 'shared' }));
    expect(result).toEqual({ isValid: true, errorMessage: null });
  });

  it('CALC-VAL-002 rejects individual with no assignee', () => {
    const result = validateCost(makeCost({ splitType: 'individual', assignedCoupleIds: [] }));
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Solo cost');
  });

  it('CALC-VAL-003 accepts individual with assignee', () => {
    const result = validateCost(
      makeCost({ splitType: 'individual', assignedCoupleIds: ['c1'] })
    );
    expect(result).toEqual({ isValid: true, errorMessage: null });
  });

  it('CALC-VAL-004 rejects subset with no assignee', () => {
    const result = validateCost(makeCost({ splitType: 'subset', assignedCoupleIds: [] }));
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Subset cost');
  });

  it('CALC-VAL-005 accepts subset with assignees', () => {
    const result = validateCost(makeCost({ splitType: 'subset', assignedCoupleIds: ['c1', 'c2'] }));
    expect(result).toEqual({ isValid: true, errorMessage: null });
  });
});

describe('getEffectiveMarkup and getCostWithMarkup', () => {
  it('CALC-MKP-001 uses override markup when present', () => {
    const withOverride = makeCost({ markupOverride: 25 });
    const withoutOverride = makeCost({ markupOverride: null });

    expect(getEffectiveMarkup(withOverride, 10)).toBe(25);
    expect(getEffectiveMarkup(withoutOverride, 10)).toBe(10);
  });

  it('CALC-MKP-002 applies markup and rounds', () => {
    const costA = makeCost({ value: 10, markupOverride: null });
    const costB = makeCost({ value: 100, markupOverride: 12.5 });

    expect(getCostWithMarkup(costA, 33.33)).toBe(13.33);
    expect(getCostWithMarkup(costB, 5)).toBe(112.5);
  });
});

describe('splitCost', () => {
  it('CALC-SPL-001 splits shared costs equally and includes zeroes for non-targets', () => {
    const cost = makeCost({ value: 90, splitType: 'shared' });
    const splits = splitCost(cost, couples, 0);

    expect(splits.get('c1')).toBe(30);
    expect(splits.get('c2')).toBe(30);
    expect(splits.get('c3')).toBe(30);

    const sum = [...splits.values()].reduce((a, b) => a + b, 0);
    expect(sum).toBe(90);
  });

  it('CALC-SPL-002 assigns shared split remainder to first eligible couple', () => {
    const cost = makeCost({ value: 10, splitType: 'shared' });
    const splits = splitCost(cost, couples, 0);

    expect(splits.get('c1')).toBe(3.34);
    expect(splits.get('c2')).toBe(3.33);
    expect(splits.get('c3')).toBe(3.33);

    const sum = [...splits.values()].reduce((a, b) => roundHalfUp(a + b), 0);
    expect(sum).toBe(10);
  });

  it('CALC-SPL-003 splits subset only across assigned valid couples', () => {
    const cost = makeCost({
      value: 100,
      splitType: 'subset',
      assignedCoupleIds: ['c1', 'c2'],
    });
    const splits = splitCost(cost, couples, 0);

    expect(splits.get('c1')).toBe(50);
    expect(splits.get('c2')).toBe(50);
    expect(splits.get('c3')).toBe(0);
  });

  it('CALC-SPL-004 splits individual only to first valid assignee', () => {
    const cost = makeCost({
      value: 40,
      splitType: 'individual',
      assignedCoupleIds: ['c2', 'c1'],
    });
    const splits = splitCost(cost, couples, 0);

    expect(splits.get('c1')).toBe(0);
    expect(splits.get('c2')).toBe(40);
    expect(splits.get('c3')).toBe(0);
  });

  it('CALC-SPL-005 applies markup before splitting', () => {
    const cost = makeCost({
      value: 100,
      splitType: 'subset',
      assignedCoupleIds: ['c1', 'c2'],
      markupOverride: null,
    });
    const splits = splitCost(cost, couples, 10);

    expect(splits.get('c1')).toBe(55);
    expect(splits.get('c2')).toBe(55);
    expect(splits.get('c3')).toBe(0);

    const totalRounded = [...splits.values()].reduce((a, b) => roundHalfUp(a + b), 0);
    expect(totalRounded).toBe(110);
  });

  it('CALC-SPL-006 ignores invalid assigned IDs', () => {
    const cost = makeCost({
      value: 100,
      splitType: 'subset',
      assignedCoupleIds: ['missing', 'c3'],
    });
    const splits = splitCost(cost, couples, 0);

    expect(splits.get('c1')).toBe(0);
    expect(splits.get('c2')).toBe(0);
    expect(splits.get('c3')).toBe(100);
  });

  it('CALC-SPL-007 returns empty map when there are no valid targets', () => {
    const cost = makeCost({
      value: 100,
      splitType: 'subset',
      assignedCoupleIds: ['missing-1', 'missing-2'],
    });
    const splits = splitCost(cost, couples, 0);

    expect(splits.size).toBe(0);
  });
});

describe('buildSummary', () => {
  it('CALC-SUM-001 computes single-currency summary correctly', () => {
    const costs: CostEntry[] = [
      makeCost({ id: 'a', name: 'Shared USD', currency: 'USD', value: 90, splitType: 'shared' }),
      makeCost({
        id: 'b',
        name: 'Subset USD',
        currency: 'USD',
        value: 30,
        splitType: 'subset',
        assignedCoupleIds: ['c1', 'c2'],
      }),
      makeCost({
        id: 'c',
        name: 'Individual USD',
        currency: 'USD',
        value: 12,
        splitType: 'individual',
        assignedCoupleIds: ['c3'],
      }),
    ];

    const rates: ExchangeRate[] = [{ currency: 'USD', rateToUSD: 1 }];
    const summary = buildSummary(couples, costs, 0, rates);

    const c1 = summary.find(s => s.coupleId === 'c1');
    const c3 = summary.find(s => s.coupleId === 'c3');

    expect(c1?.currencies[0]).toMatchObject({
      currency: 'USD',
      shared: 30,
      subset: 15,
      individual: 0,
      subtotal: 45,
      targetEquivalent: 45,
    });

    expect(c3?.currencies[0]).toMatchObject({
      currency: 'USD',
      shared: 30,
      subset: 0,
      individual: 12,
      subtotal: 42,
      targetEquivalent: 42,
    });

    expect(c1?.grandTotal).toBe(45);
    expect(c3?.grandTotal).toBe(42);
  });

  it('CALC-SUM-002 computes mixed-currency USD equivalents when rates exist', () => {
    const costs: CostEntry[] = [
      makeCost({ id: 'eur-shared', currency: 'EUR', value: 90, splitType: 'shared' }),
      makeCost({
        id: 'usd-individual',
        currency: 'USD',
        value: 30,
        splitType: 'individual',
        assignedCoupleIds: ['c1'],
      }),
    ];
    const rates: ExchangeRate[] = [
      { currency: 'EUR', rateToUSD: 1.1 },
      { currency: 'USD', rateToUSD: 1 },
    ];

    const summary = buildSummary(couples, costs, 0, rates);
    const c1 = summary.find(s => s.coupleId === 'c1');

    const eur = c1?.currencies.find(c => c.currency === 'EUR');
    const usd = c1?.currencies.find(c => c.currency === 'USD');

    expect(eur?.subtotal).toBe(30);
    expect(eur?.targetEquivalent).toBe(33);
    expect(usd?.subtotal).toBe(30);
    expect(usd?.targetEquivalent).toBe(30);
    expect(c1?.grandTotal).toBe(63);
  });

  it('CALC-SUM-003 returns null USD fields when an active currency has no rate', () => {
    const costs: CostEntry[] = [
      makeCost({ id: 'eur-shared', currency: 'EUR', value: 60, splitType: 'shared' }),
      makeCost({ id: 'gbp-shared', currency: 'GBP', value: 30, splitType: 'shared' }),
    ];
    const rates: ExchangeRate[] = [{ currency: 'EUR', rateToUSD: 1.2 }];

    const summary = buildSummary(couples, costs, 0, rates);
    const c1 = summary.find(s => s.coupleId === 'c1');
    const gbp = c1?.currencies.find(c => c.currency === 'GBP');

    expect(gbp?.subtotal).toBe(10);
    expect(gbp?.targetEquivalent).toBeNull();
    expect(c1?.grandTotal).toBeNull();
  });

  it('CALC-SUM-004 retains full currency set when a couple has only zero subtotals', () => {
    const costs: CostEntry[] = [
      makeCost({ id: 'one', currency: 'USD', value: 10, splitType: 'individual', assignedCoupleIds: ['c1'] }),
      makeCost({ id: 'two', currency: 'EUR', value: 10, splitType: 'individual', assignedCoupleIds: ['c1'] }),
    ];
    const rates: ExchangeRate[] = [
      { currency: 'USD', rateToUSD: 1 },
      { currency: 'EUR', rateToUSD: 1.1 },
    ];

    const summary = buildSummary(couples, costs, 0, rates);
    const c2 = summary.find(s => s.coupleId === 'c2');

    expect(c2?.currencies).toHaveLength(2);
    expect(c2?.currencies.every(c => c.subtotal === 0)).toBe(true);
  });

  it('filters zero-subtotal currencies when at least one active currency exists', () => {
    const costs: CostEntry[] = [
      makeCost({
        id: 'usd-active',
        currency: 'USD',
        value: 20,
        splitType: 'individual',
        assignedCoupleIds: ['c1'],
      }),
      makeCost({
        id: 'eur-zero-for-c1',
        currency: 'EUR',
        value: 12,
        splitType: 'individual',
        assignedCoupleIds: ['c2'],
      }),
    ];
    const rates: ExchangeRate[] = [
      { currency: 'USD', rateToUSD: 1 },
      { currency: 'EUR', rateToUSD: 1.1 },
    ];

    const summary = buildSummary(couples, costs, 0, rates);
    const c1 = summary.find(s => s.coupleId === 'c1');

    expect(c1?.currencies.map(c => c.currency)).toEqual(['USD']);
  });

  it('CALC-SUM-006 target currency equals cost currency yields targetEquivalent === subtotal', () => {
    const costs: CostEntry[] = [
      makeCost({ id: 'eur-shared', currency: 'EUR', value: 90, splitType: 'shared' }),
    ];
    const rates: ExchangeRate[] = [{ currency: 'EUR', rateToUSD: 1.1 }];
    const summary = buildSummary(couples, costs, 0, rates, 'EUR');
    const c1 = summary.find(s => s.coupleId === 'c1');

    expect(c1?.currencies[0]?.targetEquivalent).toBe(c1?.currencies[0]?.subtotal);
  });

  it('CALC-SUM-007 missing targetCurrency in rate map yields null targetEquivalent and grandTotal', () => {
    const costs: CostEntry[] = [
      makeCost({ id: 'eur-shared', currency: 'EUR', value: 90, splitType: 'shared' }),
    ];
    const rates: ExchangeRate[] = [{ currency: 'EUR', rateToUSD: 1.1 }];
    const summary = buildSummary(couples, costs, 0, rates, 'MXN');
    const c1 = summary.find(s => s.coupleId === 'c1');

    expect(c1?.currencies[0]?.targetEquivalent).toBeNull();
    expect(c1?.grandTotal).toBeNull();
  });

  it('CALC-SUM-008 converts correctly with non-USD targetCurrency', () => {
    const costs: CostEntry[] = [
      makeCost({ id: 'eur-ind', currency: 'EUR', value: 33, splitType: 'individual', assignedCoupleIds: ['c1'] }),
    ];
    const rates: ExchangeRate[] = [
      { currency: 'EUR', rateToUSD: 1.1 },
      { currency: 'GBP', rateToUSD: 1.3 },
    ];
    const summary = buildSummary(couples, costs, 0, rates, 'GBP');
    const c1 = summary.find(s => s.coupleId === 'c1');

    // targetEquivalent = 33 * 1.1 / 1.3
    expect(c1?.currencies[0]?.targetEquivalent).toBeCloseTo(33 * 1.1 / 1.3, 2);
    expect(c1?.grandTotal).toBeCloseTo(33 * 1.1 / 1.3, 2);
  });

  it('CALC-SUM-005 produces stable totals regardless of cost order', () => {
    const costA = makeCost({ id: 'a', currency: 'USD', value: 33.33, splitType: 'shared' });
    const costB = makeCost({ id: 'b', currency: 'USD', value: 20, splitType: 'subset', assignedCoupleIds: ['c1', 'c2'] });
    const costC = makeCost({ id: 'c', currency: 'USD', value: 7, splitType: 'individual', assignedCoupleIds: ['c3'] });
    const rates: ExchangeRate[] = [{ currency: 'USD', rateToUSD: 1 }];

    const summaryForward = buildSummary(couples, [costA, costB, costC], 0, rates);
    const summaryReverse = buildSummary(couples, [costC, costB, costA], 0, rates);

    expect(summaryForward).toEqual(summaryReverse);
  });

  it('handles empty cost input deterministically', () => {
    const summary = buildSummary(couples, [], 0, []);

    expect(summary).toHaveLength(3);
    for (const row of summary) {
      expect(row.currencies).toEqual([]);
      expect(row.grandTotal).toBe(0);
    }
  });
});

describe('formatCurrency', () => {
  it('CALC-FMT-001 formats known symbols', () => {
    expect(formatCurrency(12.3, 'USD')).toBe('$12.30');
    expect(formatCurrency(50, 'EUR')).toBe('€50.00');
  });

  it('CALC-FMT-002 falls back to currency code prefix for unknown codes', () => {
    expect(formatCurrency(7.5, 'ABC')).toBe('ABC 7.50');
  });
});

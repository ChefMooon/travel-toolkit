import type { CostEntry, Couple, ExchangeRate, CoupleSummary, CurrencyBreakdown } from '@/store/types';

/**
 * Round half-up to N decimal places.
 * 0.005 → 0.01, 0.004 → 0.00
 */
export function roundHalfUp(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor + 0.5) / factor;
}

/**
 * Validate a cost entry for consistency errors.
 * Returns an object with validation status and error message if invalid.
 */
export interface CostValidation {
  isValid: boolean;
  errorMessage: string | null;
}

export function validateCost(cost: CostEntry): CostValidation {
  // Shared costs are always valid
  if (cost.splitType === 'shared') {
    return { isValid: true, errorMessage: null };
  }

  // Individual (solo) costs must have exactly 1 person assigned
  if (cost.splitType === 'individual') {
    if (cost.assignedCoupleIds.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Solo cost must have 1 person assigned',
      };
    }
    return { isValid: true, errorMessage: null };
  }

  // Subset costs must have at least 1 person assigned
  if (cost.splitType === 'subset') {
    if (cost.assignedCoupleIds.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Subset cost must have ≥1 person assigned',
      };
    }
    return { isValid: true, errorMessage: null };
  }

  return { isValid: true, errorMessage: null };
}

export function getEffectiveMarkup(cost: CostEntry, globalMarkup: number): number {
  return cost.markupOverride !== null ? cost.markupOverride : globalMarkup;
}

export function getCostWithMarkup(cost: CostEntry, globalMarkup: number): number {
  const markup = getEffectiveMarkup(cost, globalMarkup);
  return roundHalfUp(cost.value * (1 + markup / 100));
}

/**
 * Split a single cost among the relevant couples.
 * Returns a Map of coupleId → amount.
 */
export function splitCost(
  cost: CostEntry,
  allCouples: Couple[],
  globalMarkup: number
): Map<string, number> {
  const result = new Map<string, number>();
  const totalWithMarkup = cost.value * (1 + getEffectiveMarkup(cost, globalMarkup) / 100);

  let targetCoupleIds: string[];

  switch (cost.splitType) {
    case 'shared':
      targetCoupleIds = allCouples.map(c => c.id);
      break;
    case 'subset':
      targetCoupleIds = cost.assignedCoupleIds.filter(id =>
        allCouples.some(c => c.id === id)
      );
      break;
    case 'individual':
      targetCoupleIds = cost.assignedCoupleIds.slice(0, 1).filter(id =>
        allCouples.some(c => c.id === id)
      );
      break;
  }

  if (targetCoupleIds.length === 0) {
    return result;
  }

  const perCouple = roundHalfUp(totalWithMarkup / targetCoupleIds.length);
  const roundedTotal = roundHalfUp(perCouple * targetCoupleIds.length);
  const remainder = roundHalfUp(roundHalfUp(totalWithMarkup) - roundedTotal);

  targetCoupleIds.forEach((id, i) => {
    const amount = i === 0 ? roundHalfUp(perCouple + remainder) : perCouple;
    result.set(id, amount);
  });

  // Ensure all couples not in the target list get 0
  allCouples.forEach(c => {
    if (!result.has(c.id)) {
      result.set(c.id, 0);
    }
  });

  return result;
}

/**
 * Build full summary for all couples grouped by currency.
 */
export function buildSummary(
  couples: Couple[],
  costs: CostEntry[],
  globalMarkup: number,
  exchangeRates: ExchangeRate[],
  targetCurrency: string = 'USD'
): CoupleSummary[] {
  // Gather all unique currencies
  const currenciesUsed = [...new Set(costs.map(c => c.currency))];

  const rateMap = new Map(exchangeRates.map(r => [r.currency, r.rateToUSD]));
  if (!rateMap.has('USD')) rateMap.set('USD', 1);

  const rateForTarget = targetCurrency === 'USD' ? 1 : rateMap.get(targetCurrency);

  return couples.map(couple => {
    const currencies: CurrencyBreakdown[] = currenciesUsed.map(currency => {
      const currCosts = costs.filter(c => c.currency === currency);
      let shared = 0;
      let subset = 0;
      let individual = 0;

      currCosts.forEach(cost => {
        const splits = splitCost(cost, couples, globalMarkup);
        const amount = splits.get(couple.id) ?? 0;

        switch (cost.splitType) {
          case 'shared':
            shared = roundHalfUp(shared + amount);
            break;
          case 'subset':
            subset = roundHalfUp(subset + amount);
            break;
          case 'individual':
            individual = roundHalfUp(individual + amount);
            break;
        }
      });

      const subtotal = roundHalfUp(shared + subset + individual);
      const rateForCurrency = rateMap.get(currency);
      const targetEquivalent =
        rateForCurrency !== undefined && rateForTarget !== undefined
          ? roundHalfUp((subtotal * rateForCurrency) / rateForTarget)
          : null;

      return { currency, shared, subset, individual, subtotal, targetEquivalent };
    });

    // Filter out currencies with zero subtotal
    const activeCurrencies = currencies.filter(c => c.subtotal > 0 || currenciesUsed.length <= 1);

    const grandTotal = activeCurrencies.every(c => c.targetEquivalent !== null)
      ? roundHalfUp(activeCurrencies.reduce((sum, c) => sum + (c.targetEquivalent ?? 0), 0))
      : null;

    return {
      coupleId: couple.id,
      coupleName: couple.name,
      colorIndex: couple.colorIndex,
      iconIndex: couple.iconIndex,
      currencies: activeCurrencies.length > 0 ? activeCurrencies : currencies,
      grandTotal,
      targetCurrency,
    };
  });
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const symbols: Record<string, string> = {
    EUR: '€', USD: '$', GBP: '£', MXN: 'MX$', JPY: '¥',
    CAD: 'C$', AUD: 'A$', CHF: 'CHF ', SGD: 'S$', HKD: 'HK$',
    DKK: 'kr ', SEK: 'kr ', NOK: 'kr ', NZD: 'NZ$', BRL: 'R$',
    INR: '₹', THB: '฿', ZAR: 'R',
  };
  const sym = symbols[currencyCode] ?? currencyCode + ' ';
  return `${sym}${amount.toFixed(2)}`;
}

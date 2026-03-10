import { useTripStore } from '@/store/tripStore';
import { formatCurrency } from '@/lib/calculations';
import { CURRENCY_FLAGS, COUPLE_ICONS } from '@/store/types';
import type { CoupleSummary } from '@/store/types';

interface CoupleCardProps {
  summary: CoupleSummary;
}

export default function CoupleCard({ summary }: CoupleCardProps) {
  const setExchangeRate = useTripStore((s) => s.setExchangeRate);
  const exchangeRates = useTripStore((s) => s.exchangeRates);

  const ci = summary.colorIndex;
  const icon = COUPLE_ICONS[(ci - 1) % COUPLE_ICONS.length] ?? '🧳';

  return (
    <div className={`s-card s-card-c${ci}`}>
      <div className="s-head">
        <span className="s-head-icon">{icon}</span>
        <span className="s-head-name">{summary.coupleName}</span>
      </div>
      <div className="s-body">
        {summary.currencies.map((curr, idx) => {
          const rate = exchangeRates.find((r) => r.currency === curr.currency);
          const flag = CURRENCY_FLAGS[curr.currency] ?? '🏳️';
          const isUSD = curr.currency === 'USD';

          return (
            <div key={curr.currency}>
              {idx > 0 && <hr className="sdivider" />}
              <div className="curr-block">
                <div className="curr-head">
                  <span className="curr-flag">{flag}</span>
                  <span className="curr-code">{curr.currency}</span>
                </div>
                <div className={`sline${curr.shared === 0 ? ' sline-dim' : ''}`}>
                  <span className="sline-lbl">Shared</span>
                  <span className="sline-num">{formatCurrency(curr.shared, curr.currency)}</span>
                </div>
                <div className={`sline${curr.subset === 0 ? ' sline-dim' : ''}`}>
                  <span className="sline-lbl">Subset</span>
                  <span className="sline-num">{formatCurrency(curr.subset, curr.currency)}</span>
                </div>
                <div className={`sline${curr.individual === 0 ? ' sline-dim' : ''}`}>
                  <span className="sline-lbl">Individual</span>
                  <span className="sline-num">{formatCurrency(curr.individual, curr.currency)}</span>
                </div>
                <div className="sline stotal">
                  <span className="sline-lbl">Subtotal</span>
                  <span className="sline-num">{formatCurrency(curr.subtotal, curr.currency)}</span>
                </div>
                {!isUSD && (
                  <>
                    <div className="ex-row">
                      <span className="ex-lbl">1 {curr.currency} = __ USD</span>
                      <input
                        className="ex-inp"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={rate?.rateToUSD ?? ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0) {
                            setExchangeRate(curr.currency, val);
                          }
                        }}
                        placeholder="0.0000"
                      />
                    </div>
                    {curr.usdEquivalent !== null && (
                      <div className="usd-eq">≈ ${curr.usdEquivalent.toFixed(2)}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="s-grand">
        <span className="s-grand-lbl">Grand Total</span>
        <span className="s-grand-num">
          {summary.grandTotalUSD !== null ? `$${summary.grandTotalUSD.toFixed(2)}` : '—'}
        </span>
      </div>
    </div>
  );
}

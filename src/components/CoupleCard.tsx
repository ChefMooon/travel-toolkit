import { useState, useMemo } from 'react';
import { useTripStore } from '@/store/tripStore';
import { formatCurrency } from '@/lib/calculations';
import { CURRENCY_FLAGS, COUPLE_ICONS, getColorThemeValue } from '@/store/types';
import IconChoiceModal from './IconChoiceModal';
import ColorChoiceModal from './ColorChoiceModal';
import type { CoupleSummary } from '@/store/types';

interface CoupleCardProps {
  summary: CoupleSummary;
}

export default function CoupleCard({ summary }: CoupleCardProps) {
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);

  const setExchangeRate = useTripStore((s) => s.setExchangeRate);
  const exchangeRates = useTripStore((s) => s.exchangeRates);
  const updateCoupleIcon = useTripStore((s) => s.updateCoupleIcon);
  const updateCoupleColor = useTripStore((s) => s.updateCoupleColor);
  const theme = useTripStore((s) => s.theme);

  const ci = summary.colorIndex;
  const icon = COUPLE_ICONS[summary.iconIndex] ?? '🧳';
  const colorDotColor = useMemo(
    () => getColorThemeValue(summary.colorIndex, theme),
    [summary.colorIndex, theme]
  );
  const cardBorderColor = useMemo(
    () => `color-mix(in srgb, ${colorDotColor} 30%, white)`,
    [colorDotColor]
  );
  const cardSoftBackground = useMemo(
    () => `color-mix(in srgb, ${colorDotColor} 18%, transparent)`,
    [colorDotColor]
  );

  const handleIconConfirm = (iconIndex: number) => {
    updateCoupleIcon(summary.coupleId, iconIndex);
    setIconModalOpen(false);
  };

  const handleColorConfirm = (colorIndex: number) => {
    updateCoupleColor(summary.coupleId, colorIndex);
    setColorModalOpen(false);
  };

  return (
    <>
      <div
        className={`s-card s-card-c${ci}`}
        data-testid="s-card"
        style={{ borderColor: cardBorderColor }}
      >
        <div className="s-head" style={{ background: colorDotColor }}>
          <div
            className="icon-with-tint"
            onClick={() => setIconModalOpen(true)}
            style={{ position: 'relative', zIndex: 10, '--group-color': colorDotColor } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={`Change icon for ${summary.coupleName}`}
            data-testid="s-head-icon"
          >
            <span className="s-head-icon">{icon}</span>
          </div>
          <div
            className="color-dot-interactive"
            onClick={() => setColorModalOpen(true)}
            style={{
              position: 'relative',
              zIndex: 10,
              '--group-color': colorDotColor,
            } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={`Change color for ${summary.coupleName}`}
            data-testid="color-dot"
          >
            ●
          </div>
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
        <div className="s-grand" style={{ background: cardSoftBackground }}>
          <span className="s-grand-lbl">Grand Total</span>
          <span className="s-grand-num" style={{ color: colorDotColor }}>
            {summary.grandTotalUSD !== null ? `$${summary.grandTotalUSD.toFixed(2)}` : '—'}
          </span>
        </div>
      </div>

      {iconModalOpen && (
        <IconChoiceModal
          iconIndex={summary.iconIndex}
          onConfirm={handleIconConfirm}
          onCancel={() => setIconModalOpen(false)}
        />
      )}

      {colorModalOpen && (
        <ColorChoiceModal
          colorIndex={summary.colorIndex}
          onConfirm={handleColorConfirm}
          onCancel={() => setColorModalOpen(false)}
        />
      )}
    </>
  );
}

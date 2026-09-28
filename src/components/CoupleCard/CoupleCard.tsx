import { useState, useMemo } from 'react';
import { useTripStore } from '@/store/tripStore';
import { formatCurrency } from '@/lib/calculations';
import { CURRENCY_FLAGS, COUPLE_ICONS, getColorThemeValue, CURRENCY_SYMBOLS } from '@/store/types';
import IconChoiceModal from '../IconChoiceModal';
import ColorChoiceModal from '../ColorChoiceModal';
import type { CoupleSummary } from '@/store/types';

interface CoupleCardProps {
  summary: CoupleSummary;
  share?: number;
}

export default function CoupleCard({ summary, share }: CoupleCardProps) {
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const setExchangeRate = useTripStore((s) => s.setExchangeRate);
  const exchangeRates = useTripStore((s) => s.exchangeRates);
  const clearExchangeRateOverride = useTripStore((s) => s.clearExchangeRateOverride);
  const updateCoupleIcon = useTripStore((s) => s.updateCoupleIcon);
  const updateCoupleColor = useTripStore((s) => s.updateCoupleColor);
  const theme = useTripStore((s) => s.theme);

  const ci = summary.colorIndex;
  const icon = COUPLE_ICONS[summary.iconIndex]?.symbol ?? '🧳';
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

  const targetSymbol = CURRENCY_SYMBOLS[summary.targetCurrency] ?? summary.targetCurrency;

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
            const isEditing = editingCurrency === curr.currency;

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

                  {/* Implied rate row: USD cost when target is non-USD */}
                  {isUSD && summary.targetCurrency !== 'USD' && (() => {
                    const targetRate = exchangeRates.find((r) => r.currency === summary.targetCurrency);
                    if (!targetRate) return null;
                    return (
                      <div className="ex-row" data-testid={`implied-rate-${curr.currency}`}>
                        <span className="ex-lbl">
                          1 USD = {(1 / targetRate.rateToUSD).toFixed(4)} {summary.targetCurrency}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Inline edit mode (triggered from auto or no-rate state) */}
                  {!isUSD && isEditing && (
                    <div className="ex-row">
                      <span className="ex-lbl">1 {curr.currency} = __ USD</span>
                      <input
                        className="ex-inp"
                        type="number"
                        step="0.0001"
                        min="0"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          const val = parseFloat(editValue);
                          if (!isNaN(val) && val > 0) {
                            setExchangeRate(curr.currency, val);
                          }
                          setEditingCurrency(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat(editValue);
                            if (!isNaN(val) && val > 0) {
                              setExchangeRate(curr.currency, val);
                            }
                            setEditingCurrency(null);
                          } else if (e.key === 'Escape') {
                            setEditingCurrency(null);
                          }
                        }}
                        placeholder="0.0000"
                      />
                    </div>
                  )}

                  {/* Override state: user-supplied rate with lock icon and reset link */}
                  {!isUSD && !isEditing && !!rate?.isOverridden && (
                    <div className="ex-row">
                      <span className="ex-lbl">1 {curr.currency} =</span>
                      <button
                        type="button"
                        className="ex-reset-btn"
                        onClick={() => clearExchangeRateOverride(curr.currency)}
                      >
                        Reset to live
                      </button>
                      <span className="ex-lock" aria-label="rate overridden">🔒</span>
                      <input
                        className="ex-inp"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={rate.rateToUSD}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0) {
                            setExchangeRate(curr.currency, val);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Auto state: live rate shown as read-only text with pencil */}
                  {!isUSD && !isEditing && !rate?.isOverridden && !!rate && (
                    <div className="ex-row">
                      <span className="ex-lbl">1 {curr.currency} = {rate.rateToUSD.toFixed(4)} USD</span>
                      <button
                        type="button"
                        className="ex-edit-btn"
                        aria-label={`Edit rate for ${curr.currency}`}
                        onClick={() => {
                          setEditingCurrency(curr.currency);
                          setEditValue(rate.rateToUSD.toFixed(4));
                        }}
                      >
                        ✏
                      </button>
                    </div>
                  )}

                  {/* No-rate state: no rate entry yet */}
                  {!isUSD && !isEditing && !rate && (
                    <div className="ex-row">
                      <span className="ex-lbl">1 {curr.currency} = — USD</span>
                      <button
                        type="button"
                        className="ex-edit-btn"
                        aria-label={`Add rate for ${curr.currency}`}
                        onClick={() => {
                          setEditingCurrency(curr.currency);
                          setEditValue('');
                        }}
                      >
                        ✏
                      </button>
                    </div>
                  )}

                  {!isUSD && curr.targetEquivalent !== null && (
                    <div className="usd-eq">≈ {targetSymbol}{curr.targetEquivalent.toFixed(2)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="s-grand" style={{ background: cardSoftBackground }}>
          <span className="s-grand-lbl">
            Grand Total
            {summary.targetCurrency !== 'USD' && (
              <span className="s-grand-lbl-sub"> ({targetSymbol})</span>
            )}
          </span>
          <span className="s-grand-values">
            <span className="s-grand-num" style={{ color: colorDotColor }}>
              {summary.grandTotal !== null ? `${targetSymbol}${summary.grandTotal.toFixed(2)}` : '—'}
            </span>
            {share !== undefined && summary.grandTotal !== null && (
              <span className="s-grand-share" data-testid="group-share">
                {new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(share)}
              </span>
            )}
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

import { useState } from 'react';
import { useTripStore } from '@/store/tripStore';
import { CURRENCY_FLAGS, CURRENCY_SYMBOLS, COUPLE_ICONS } from '@/store/types';
import IconChoiceModal from '../IconChoiceModal';
import ColorChoiceModal from '../ColorChoiceModal';
import Tooltip from '@/components/Tooltip';
import type { CoupleSummary } from '@/store/types';
import { useResolvedTheme } from '@/store/theme';
import { getGroupPresentation } from '@/lib/groupPresentation';
import NumericInput from '@/components/NumericInput/NumericInput';
import { formatNumber } from '@/i18n/format';
import { formatCurrency as formatLocaleCurrency } from '@/i18n/format';
import { useTranslation } from 'react-i18next';

interface CoupleCardProps {
  summary: CoupleSummary;
  share?: number;
}

export default function CoupleCard({ summary, share }: CoupleCardProps) {
  const { t } = useTranslation();
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const setExchangeRate = useTripStore((s) => s.setExchangeRate);
  const exchangeRates = useTripStore((s) => s.exchangeRates);
  const clearExchangeRateOverride = useTripStore((s) => s.clearExchangeRateOverride);
  const updateCoupleIcon = useTripStore((s) => s.updateCoupleIcon);
  const updateCoupleColor = useTripStore((s) => s.updateCoupleColor);
  const theme = useResolvedTheme();

  const ci = summary.colorIndex;
  const icon = COUPLE_ICONS[summary.iconIndex]?.symbol ?? '🧳';
  const groupPresentation = getGroupPresentation(summary.colorIndex, theme);
  const { foreground, totalForeground, borderColor, softBackground, headerBackground, headerForeground } = groupPresentation;

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
        style={{ borderColor }}
      >
        <div className="s-head" style={{ background: headerBackground }}>
          <Tooltip content={t('chooseDifferentGroupIcon')}>
            <button
              type="button"
              className="icon-with-tint"
              onClick={() => setIconModalOpen(true)}
              style={{ position: 'relative', zIndex: 10, '--group-color': foreground } as React.CSSProperties}
              aria-label={t('changeGroupIcon', { name: summary.coupleName })}
              data-testid="s-head-icon"
            >
              <span className="s-head-icon">{icon}</span>
            </button>
          </Tooltip>
          <Tooltip content={t('changeGroupColor')}>
            <button
              type="button"
              className="color-dot-interactive"
              onClick={() => setColorModalOpen(true)}
              style={{
                position: 'relative',
                zIndex: 10,
                '--group-color': foreground,
                color: foreground,
              } as React.CSSProperties}
              aria-label={t('changeGroupColorFor', { name: summary.coupleName })}
              data-testid="color-dot"
            >
              ●
            </button>
          </Tooltip>
          <span className="s-head-name" style={{ color: headerForeground }}><bdi dir="auto">{summary.coupleName}</bdi></span>
        </div>
        <div className="s-body">
          {summary.currencies.map((curr, idx) => {
            const rate = exchangeRates.find((r) => r.currency === curr.currency);
            const flag = CURRENCY_FLAGS[curr.currency] ?? '🏳️';
            const isUSD = curr.currency === 'USD';
            const isEditing = editingCurrency === curr.currency;
            const rateInputId = `exchange-rate-${summary.coupleId}-${curr.currency}`;

            return (
              <div key={curr.currency}>
                {idx > 0 && <hr className="sdivider" />}
                <div className="curr-block">
                  <div className="curr-head">
                    <span className="curr-flag">{flag}</span>
                    <span className="curr-code">{curr.currency}</span>
                  </div>
                  <div className={`sline${curr.shared === 0 ? ' sline-dim' : ''}`}>
                    <span className="sline-lbl">{t('shared')}</span>
                    <span className="sline-num">{formatLocaleCurrency(curr.shared, curr.currency)}</span>
                  </div>
                  <div className={`sline${curr.subset === 0 ? ' sline-dim' : ''}`}>
                    <span className="sline-lbl">{t('subset')}</span>
                    <span className="sline-num">{formatLocaleCurrency(curr.subset, curr.currency)}</span>
                  </div>
                  <div className={`sline${curr.individual === 0 ? ' sline-dim' : ''}`}>
                    <span className="sline-lbl">{t('individual')}</span>
                    <span className="sline-num">{formatLocaleCurrency(curr.individual, curr.currency)}</span>
                  </div>
                  <div className="sline stotal">
                    <span className="sline-lbl">{t('subtotal')}</span>
                    <span className="sline-num">{formatLocaleCurrency(curr.subtotal, curr.currency)}</span>
                  </div>

                  {/* Implied rate row: USD cost when target is non-USD */}
                  {isUSD && summary.targetCurrency !== 'USD' && (() => {
                    const targetRate = exchangeRates.find((r) => r.currency === summary.targetCurrency);
                    if (!targetRate) return null;
                    return (
                      <div className="ex-row" data-testid={`implied-rate-${curr.currency}`}>
                        <span className="ex-lbl">
                          1 <bdi dir="ltr">USD</bdi> = {formatNumber(1 / targetRate.rateToUSD, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} <bdi dir="ltr">{summary.targetCurrency}</bdi>
                        </span>
                      </div>
                    );
                  })()}

                  {/* Inline edit mode (triggered from auto or no-rate state) */}
                  {!isUSD && isEditing && (
                    <div className="ex-row">
                      <span className="ex-lbl">1 <bdi dir="ltr">{curr.currency}</bdi> = __ <bdi dir="ltr">USD</bdi></span>
                      <label htmlFor={rateInputId} className="sr-only">
                        {t('exchangeRateUsd', { currency: curr.currency })}
                      </label>
                      <NumericInput
                        id={rateInputId}
                        aria-label={t('exchangeRateUsd', { currency: curr.currency })}
                        className="ex-inp"
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
                      <span className="ex-lbl">1 <bdi dir="ltr">{curr.currency}</bdi> =</span>
                      <button
                        type="button"
                        className="ex-reset-btn"
                        onClick={() => clearExchangeRateOverride(curr.currency)}
                      >
                        {t('resetToLive')}
                      </button>
                      <span className="ex-lock" aria-label={t('rateOverridden')}>🔒</span>
                      <label htmlFor={rateInputId} className="sr-only">
                        {t('exchangeRateUsd', { currency: curr.currency })}
                      </label>
                      <NumericInput
                        id={rateInputId}
                        aria-label={t('exchangeRateUsd', { currency: curr.currency })}
                        className="ex-inp"
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
                      <span className="ex-lbl">1 <bdi dir="ltr">{curr.currency}</bdi> = {formatNumber(rate.rateToUSD, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} <bdi dir="ltr">USD</bdi></span>
                      <Tooltip content={t('editExchangeRate')}>
                        <button
                          type="button"
                          className="ex-edit-btn"
                          aria-label={t('editRateFor', { currency: curr.currency })}
                          onClick={() => {
                            setEditingCurrency(curr.currency);
                            setEditValue(rate.rateToUSD.toFixed(4));
                          }}
                        >
                          ✏
                        </button>
                      </Tooltip>
                    </div>
                  )}

                  {/* No-rate state: no rate entry yet */}
                  {!isUSD && !isEditing && !rate && (
                    <div className="ex-row">
                      <span className="ex-lbl">1 <bdi dir="ltr">{curr.currency}</bdi> = — <bdi dir="ltr">USD</bdi></span>
                      <Tooltip content={t('addExchangeRate')}>
                        <button
                          type="button"
                          className="ex-edit-btn"
                          aria-label={t('addRateFor', { currency: curr.currency })}
                          onClick={() => {
                            setEditingCurrency(curr.currency);
                            setEditValue('');
                          }}
                        >
                          ✏
                        </button>
                      </Tooltip>
                    </div>
                  )}

                  {!isUSD && curr.targetEquivalent !== null && (
                    <div className="usd-eq">≈ {formatLocaleCurrency(curr.targetEquivalent, summary.targetCurrency)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="s-grand" style={{ background: softBackground }}>
          <span className="s-grand-lbl">
            {t('grandTotal')}
            {summary.targetCurrency !== 'USD' && (
              <span className="s-grand-lbl-sub">(<bdi dir="ltr">{CURRENCY_SYMBOLS[summary.targetCurrency] ?? summary.targetCurrency}</bdi>)</span>
            )}
          </span>
          <span className="s-grand-values">
            <span className="s-grand-num" style={{ color: totalForeground }}>
              {summary.grandTotal !== null ? formatLocaleCurrency(summary.grandTotal, summary.targetCurrency) : '—'}
            </span>
            {share !== undefined && summary.grandTotal !== null && (
              <span className="s-grand-share" data-testid="group-share">
                {formatNumber(share, { style: 'percent', maximumFractionDigits: 1 })}
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

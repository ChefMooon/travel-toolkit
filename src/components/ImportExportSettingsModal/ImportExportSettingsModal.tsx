import { useId } from 'react';
import { X } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { ModalShell } from '@/components/Modal';
import CogIcon from './CogIcon';
import { useTranslation } from 'react-i18next';

interface ImportExportSettingsModalProps {
  onClose: () => void;
}

export default function ImportExportSettingsModal({ onClose }: ImportExportSettingsModalProps) {
  const { t } = useTranslation();
  const exportSchema = useSettingsStore((s) => s.exportSchema);
  const exportFilenamePreset = useSettingsStore((s) => s.exportFilenamePreset);
  const exportIncludeDate = useSettingsStore((s) => s.exportIncludeDate);
  const importExchangeRateMode = useSettingsStore((s) => s.importExchangeRateMode);
  const setExportSchema = useSettingsStore((s) => s.setExportSchema);
  const setExportFilenamePreset = useSettingsStore((s) => s.setExportFilenamePreset);
  const setExportIncludeDate = useSettingsStore((s) => s.setExportIncludeDate);
  const setImportExchangeRateMode = useSettingsStore((s) => s.setImportExchangeRateMode);

  const titleId = useId();

  return (
    <ModalShell
      onClose={onClose}
      labelledBy={titleId}
      overlayClassName="ie-settings-overlay"
      className="ie-settings-modal"
    >
        <div className="ie-settings-header">
          <div className="ie-settings-title-row">
            <CogIcon />
            <h2 id={titleId} className="ie-settings-title">{t('importExportSettings')}</h2>
          </div>
          <button type="button" className="ie-settings-close" onClick={onClose} aria-label={t('closeSettings')}>
            <X size={16} />
          </button>
        </div>

        {/* ── Export Defaults ── */}
        <section className="ie-settings-section">
          <h3 className="ie-settings-section-title">{t('exportDefaults')}</h3>

          <div className="ie-settings-field">
            <span className="ie-settings-field-label">{t('exportFormat')}</span>
            <div className="ie-settings-option-group">
              <button
                type="button"
                className={`ie-settings-option${exportSchema === 'three-sheet' ? ' is-active' : ''}`}
                onClick={() => setExportSchema('three-sheet')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#2CBF6D' }} />
                <span>.xlsx v1</span>
                <span className="save-data-io-dropdown-desc">{t('multiSheet')}</span>
              </button>
              <button
                type="button"
                className={`ie-settings-option${exportSchema === 'single-sheet' ? ' is-active' : ''}`}
                onClick={() => setExportSchema('single-sheet')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#9CE7B5' }} />
                <span>.xlsx v2</span>
                <span className="save-data-io-dropdown-desc">{t('singleSheet')}</span>
              </button>
            </div>
          </div>

          <div className="ie-settings-field">
            <span className="ie-settings-field-label">{t('filenamePreset')}</span>
            <div className="ie-settings-option-group">
              {(
                [
                  { value: 'tripId', label: t('filenameTripId') },
                  { value: 'tripName', label: t('filenameTripName') },
                  { value: 'slotLabel', label: t('filenameSlotName') },
                  { value: 'custom', label: t('customPreset') },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`ie-settings-option${exportFilenamePreset === item.value ? ' is-active' : ''}`}
                  onClick={() => setExportFilenamePreset(item.value)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="ie-settings-checkbox-row">
            <input
              type="checkbox"
              checked={exportIncludeDate}
              onChange={(e) => setExportIncludeDate(e.target.checked)}
            />
            <span>{t('includeDateInFilename')}</span>
          </label>
        </section>

        <div className="ie-settings-divider" />

        {/* ── Import Defaults ── */}
        <section className="ie-settings-section">
          <h3 className="ie-settings-section-title">{t('importDefaults')}</h3>

          <div className="ie-settings-field">
            <span className="ie-settings-field-label">{t('exchangeRates')}</span>
            <div className="ie-settings-option-group">
              <button
                type="button"
                className={`ie-settings-option${importExchangeRateMode === 'hybrid' ? ' is-active' : ''}`}
                onClick={() => setImportExchangeRateMode('hybrid')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#5AA3FF' }} />
                <span>{t('hybridRates')}</span>
                <span className="save-data-io-dropdown-desc">{t('keepOverridesRefreshOthers')}</span>
              </button>
              <button
                type="button"
                className={`ie-settings-option${importExchangeRateMode === 'keep-imported' ? ' is-active' : ''}`}
                onClick={() => setImportExchangeRateMode('keep-imported')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#2CBF6D' }} />
                <span>{t('keepImportedRates')}</span>
                <span className="save-data-io-dropdown-desc">{t('freezeAllFromFile')}</span>
              </button>
              <button
                type="button"
                className={`ie-settings-option${importExchangeRateMode === 'refresh-live' ? ' is-active' : ''}`}
                onClick={() => setImportExchangeRateMode('refresh-live')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#F2B65A' }} />
                <span>{t('refreshWithLive')}</span>
                <span className="save-data-io-dropdown-desc">{t('liveRatesOverrideImported')}</span>
              </button>
            </div>
          </div>
        </section>
    </ModalShell>
  );
}

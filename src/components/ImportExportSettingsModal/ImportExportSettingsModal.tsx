import { useCallback, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import CogIcon from './CogIcon';

interface ImportExportSettingsModalProps {
  onClose: () => void;
}

export default function ImportExportSettingsModal({ onClose }: ImportExportSettingsModalProps) {
  const exportSchema = useSettingsStore((s) => s.exportSchema);
  const exportFilenamePreset = useSettingsStore((s) => s.exportFilenamePreset);
  const exportIncludeDate = useSettingsStore((s) => s.exportIncludeDate);
  const importExchangeRateMode = useSettingsStore((s) => s.importExchangeRateMode);
  const setExportSchema = useSettingsStore((s) => s.setExportSchema);
  const setExportFilenamePreset = useSettingsStore((s) => s.setExportFilenamePreset);
  const setExportIncludeDate = useSettingsStore((s) => s.setExportIncludeDate);
  const setImportExchangeRateMode = useSettingsStore((s) => s.setImportExchangeRateMode);

  const titleId = useId();

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="ie-settings-overlay" onClick={handleBackdropClick}>
      <div
        className="ie-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ie-settings-header">
          <div className="ie-settings-title-row">
            <CogIcon />
            <h2 id={titleId} className="ie-settings-title">Import / Export Settings</h2>
          </div>
          <button type="button" className="ie-settings-close" onClick={onClose} aria-label="Close settings">
            <X size={16} />
          </button>
        </div>

        {/* ── Export Defaults ── */}
        <section className="ie-settings-section">
          <h3 className="ie-settings-section-title">Export Defaults</h3>

          <div className="ie-settings-field">
            <span className="ie-settings-field-label">Format</span>
            <div className="ie-settings-option-group">
              <button
                type="button"
                className={`ie-settings-option${exportSchema === 'three-sheet' ? ' is-active' : ''}`}
                onClick={() => setExportSchema('three-sheet')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#2CBF6D' }} />
                <span>.xlsx v1</span>
                <span className="save-data-io-dropdown-desc">Multi-sheet</span>
              </button>
              <button
                type="button"
                className={`ie-settings-option${exportSchema === 'single-sheet' ? ' is-active' : ''}`}
                onClick={() => setExportSchema('single-sheet')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#9CE7B5' }} />
                <span>.xlsx v2</span>
                <span className="save-data-io-dropdown-desc">Single sheet</span>
              </button>
            </div>
          </div>

          <div className="ie-settings-field">
            <span className="ie-settings-field-label">Filename preset</span>
            <div className="ie-settings-option-group">
              {(
                [
                  { value: 'tripId', label: 'Trip ID' },
                  { value: 'tripName', label: 'Trip Name' },
                  { value: 'slotLabel', label: 'Slot Name' },
                  { value: 'custom', label: 'Custom' },
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
            <span>Include date in filename</span>
          </label>
        </section>

        <div className="ie-settings-divider" />

        {/* ── Import Defaults ── */}
        <section className="ie-settings-section">
          <h3 className="ie-settings-section-title">Import Defaults</h3>

          <div className="ie-settings-field">
            <span className="ie-settings-field-label">Exchange rates</span>
            <div className="ie-settings-option-group">
              <button
                type="button"
                className={`ie-settings-option${importExchangeRateMode === 'hybrid' ? ' is-active' : ''}`}
                onClick={() => setImportExchangeRateMode('hybrid')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#5AA3FF' }} />
                <span>Hybrid rates</span>
                <span className="save-data-io-dropdown-desc">Keep overrides, refresh others</span>
              </button>
              <button
                type="button"
                className={`ie-settings-option${importExchangeRateMode === 'keep-imported' ? ' is-active' : ''}`}
                onClick={() => setImportExchangeRateMode('keep-imported')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#2CBF6D' }} />
                <span>Keep imported rates</span>
                <span className="save-data-io-dropdown-desc">Freeze all from file</span>
              </button>
              <button
                type="button"
                className={`ie-settings-option${importExchangeRateMode === 'refresh-live' ? ' is-active' : ''}`}
                onClick={() => setImportExchangeRateMode('refresh-live')}
              >
                <span className="save-data-io-dropdown-dot" style={{ background: '#F2B65A' }} />
                <span>Refresh with live</span>
                <span className="save-data-io-dropdown-desc">Live rates override imported</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}

import { useId, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronUp, GripVertical, Settings2, X } from 'lucide-react';
import { useTimezoneStore, type DetailLevel, type DisplayMode, type TrackedZone } from '@/store/timezoneStore';
import Tooltip from '@/components/Tooltip';
import { useTranslation } from 'react-i18next';

interface ZoneConfigRowProps {
  zone: TrackedZone;
}

export default function ZoneConfigRow({ zone }: ZoneConfigRowProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const settingsId = useId();
  const updateZone = useTimezoneStore((state) => state.updateZone);
  const removeZone = useTimezoneStore((state) => state.removeZone);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: zone.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const setDisplayMode = (displayMode: DisplayMode) => {
    updateZone(zone.id, { displayMode });
  };

  const setDetailLevel = (detailLevel: DetailLevel) => {
    updateZone(zone.id, { detailLevel });
  };

  return (
    <div
      ref={setNodeRef}
      className={`timezone-config-row${isDragging ? ' is-dragging' : ''}`}
      style={style}
    >
      <div className="timezone-config-row-summary">
        <Tooltip content={t('zoneReorder', { label: zone.label })}>
          <button
            type="button"
            className="ibtn timezone-row-drag"
            aria-label={t('zoneReorder', { label: zone.label })}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
        </Tooltip>

        <div className="timezone-config-row-title">
          <span className="timezone-config-row-label"><bdi dir="auto">{zone.label}</bdi></span>
          <span className="timezone-config-row-id"><bdi dir="ltr">{zone.tz}</bdi></span>
        </div>

        <div className="timezone-row-actions">
          <button
            type="button"
            className="ibtn"
            aria-label={t(isExpanded ? 'zoneHideSettingsFor' : 'zoneShowSettingsFor', { label: zone.label })}
            aria-expanded={isExpanded}
            aria-controls={settingsId}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? <ChevronUp size={16} /> : <Settings2 size={16} />}
          </button>
          <button
            type="button"
            className="ibtn del"
            onClick={() => removeZone(zone.id)}
            aria-label={t('zoneRemove', { label: zone.label })}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div id={settingsId} className="timezone-zone-settings">
          <label className="timezone-config-field">
            <span>{t('zoneDisplayLabel')}</span>
            <input
              className="tool-input"
              value={zone.label}
              onChange={(event) => updateZone(zone.id, { label: event.target.value })}
              aria-label={t('zoneTimezoneLabelFor', { tz: zone.tz })}
            />
          </label>

          <div className="timezone-config-choice-row">
            <span className="timezone-config-field-label">{t('zoneDisplayMode')}</span>
            <div className="seg" role="group" aria-label={t('zoneDisplayModeFor', { tz: zone.tz })}>
              <button
                type="button"
                className={`seg-btn${zone.displayMode === 'analog' ? ' on' : ''}`}
                aria-pressed={zone.displayMode === 'analog'}
                onClick={() => setDisplayMode('analog')}
              >
                {t('zoneAnalog')}
              </button>
              <button
                type="button"
                className={`seg-btn${zone.displayMode === 'digital' ? ' on' : ''}`}
                aria-pressed={zone.displayMode === 'digital'}
                onClick={() => setDisplayMode('digital')}
              >
                {t('zoneDigital')}
              </button>
            </div>
          </div>

          {zone.displayMode === 'digital' && (
            <div className="timezone-config-choice-row">
              <span className="timezone-config-field-label">{t('zoneDetailLevel')}</span>
              <div className="seg" role="group" aria-label={t('zoneDetailLevelFor', { tz: zone.tz })}>
                <button
                  type="button"
                  className={`seg-btn${zone.detailLevel === 'compact' ? ' on' : ''}`}
                  aria-pressed={zone.detailLevel === 'compact'}
                  onClick={() => setDetailLevel('compact')}
                >
                  {t('zoneCompact')}
                </button>
                <button
                  type="button"
                  className={`seg-btn${zone.detailLevel === 'detailed' ? ' on' : ''}`}
                  aria-pressed={zone.detailLevel === 'detailed'}
                  onClick={() => setDetailLevel('detailed')}
                >
                  {t('zoneDetailed')}
                </button>
              </div>
            </div>
          )}

          <div className="timezone-config-toggles">
            <label className="timezone-config-toggle">
              <input
                type="checkbox"
                checked={zone.showUTC}
                onChange={(event) => updateZone(zone.id, { showUTC: event.target.checked })}
              />
              {t('zoneShowUTC')}
            </label>
            <label className="timezone-config-toggle">
              <input
                type="checkbox"
                checked={zone.showDate}
                onChange={(event) => updateZone(zone.id, { showDate: event.target.checked })}
              />
              {t('zoneShowDate')}
            </label>
            <label className="timezone-config-toggle">
              <input
                type="checkbox"
                checked={zone.showSeconds}
                onChange={(event) => updateZone(zone.id, { showSeconds: event.target.checked })}
              />
              {t('zoneShowSeconds')}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

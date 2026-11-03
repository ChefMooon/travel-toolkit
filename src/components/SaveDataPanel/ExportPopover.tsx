import { useId, useMemo, useState, type RefObject } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnchoredPopover } from '@/components/Popover';
import Select from '@/components/Select/Select';
import CogIcon from '@/components/ImportExportSettingsModal/CogIcon';
import { buildExportFilename } from '@/lib/xlsx/filename';
import type { ExportOptions, ExportSchema, ExportSource, FileNamePreset } from '@/lib/xlsx/types';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';
import { MAX_SAVE_SLOTS, getDefaultSlotLabel, type SaveSlot, type TripSnapshot } from '@/store/types';

const MAX_CUSTOM_NAME_LENGTH = 60;
const ACTIVE_SOURCE_KEY = 'active';

function sourceKey(source: ExportSource): string {
  return source.type === 'active' ? ACTIVE_SOURCE_KEY : `slot-${source.slotIndex}`;
}

function sourceFromKey(key: string): ExportSource {
  if (key === ACTIVE_SOURCE_KEY) return { type: 'active' };
  return { type: 'slot', slotIndex: Number(key.slice('slot-'.length)) };
}

interface ExportPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  id: string;
  /** Read once per mount: the parent remounts this (via `key`) each time it opens. */
  initialSource: ExportSource;
  slots: Array<SaveSlot | null>;
  displayLabels: string[];
  onOpenSettings: () => void;
  /** True while the settings modal opened from here is up, so the popover stays open behind it. */
  settingsOpen: boolean;
}

export default function ExportPopover({
  open,
  onClose,
  anchorRef,
  id,
  initialSource,
  slots,
  displayLabels,
  onOpenSettings,
  settingsOpen,
}: ExportPopoverProps) {
  const { t } = useTranslation();
  const tripId = useTripStore((s) => s.tripId);
  const tripName = useTripStore((s) => s.tripName);
  const pushToast = useToastStore((s) => s.pushToast);

  // Defaults come from the saved import/export settings each time the popover opens.
  const [schema, setSchema] = useState<ExportSchema>(() => useSettingsStore.getState().exportSchema);
  const [source, setSource] = useState<ExportSource>(initialSource);
  const [namePreset, setNamePreset] = useState<FileNamePreset>(() => useSettingsStore.getState().exportFilenamePreset);
  const [includeDate, setIncludeDate] = useState(() => useSettingsStore.getState().exportIncludeDate);
  const [customName, setCustomName] = useState('');
  const [nameOptionsOpen, setNameOptionsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // One timestamp for both the preview and the written file, so the names always match.
  const [now] = useState(() => new Date());

  const titleId = useId();
  const fileNameLabelId = useId();
  const nameOptionsId = useId();
  const formatName = useId();
  const customNameId = useId();

  const untitled = t('untitledTrip');
  const sourceOptions = useMemo(() => {
    const keys = [ACTIVE_SOURCE_KEY];
    for (let index = 0; index < MAX_SAVE_SLOTS; index++) {
      if (slots[index]) keys.push(`slot-${index}`);
    }
    return keys;
  }, [slots]);

  const getSourceLabel = (key: string) => {
    const option = sourceFromKey(key);
    if (option.type === 'active') return t('exportSourceOption', { source: t('activeTrip'), trip: tripName || untitled });
    const slot = slots[option.slotIndex];
    const label = displayLabels[option.slotIndex] ?? getDefaultSlotLabel(option.slotIndex);
    return slot ? t('exportSourceOption', { source: label, trip: slot.tripName || untitled }) : label;
  };

  const presetOptions: FileNamePreset[] = ['tripName', 'tripId', 'slotLabel', 'custom'];
  const getPresetLabel = (preset: string) => {
    if (preset === 'tripName') return t('tripNamePreset');
    if (preset === 'slotLabel') return t('slotNamePreset');
    if (preset === 'custom') return t('customPreset');
    return t('tripId');
  };

  const selectedSlot = source.type === 'slot' ? slots[source.slotIndex] ?? null : null;
  const options: ExportOptions = {
    schema,
    source,
    namePreset,
    customName: customName || undefined,
    slotLabel: source.type === 'slot' ? displayLabels[source.slotIndex] : undefined,
    includeDate,
  };
  const previewSnapshot = source.type === 'slot' ? selectedSlot ?? { tripId: '', tripName: '' } : { tripId, tripName };
  const fileName = buildExportFilename(previewSnapshot, options, now);

  const handleExport = async () => {
    if (isExporting) return;
    if (source.type === 'active' && useTripStore.getState().dateDraftError) {
      pushToast({ type: 'warning', title: t('tripDatesNeedAttention'), message: t('invalidTripDateDraft') });
      return;
    }
    let snapshot: TripSnapshot;
    if (source.type === 'slot') {
      if (!selectedSlot) {
        pushToast({ type: 'warning', title: t('slotEmptyTitle'), message: t('emptySlotSelect') });
        return;
      }
      snapshot = selectedSlot.data;
    } else {
      snapshot = useTripStore.getState().getSnapshot();
    }

    setIsExporting(true);
    try {
      const { exportWorkbook } = await import('@/lib/xlsx/exportWorkbook');
      await exportWorkbook(snapshot, options, now);
      pushToast({
        type: 'success',
        title: t('exported'),
        message: t('tripExported', { format: t(schema === 'three-sheet' ? 'multiSheetFormat' : 'singleSheetFormat') }),
      });
      onClose();
    } catch {
      pushToast({ type: 'error', title: t('exportFailed'), message: t('couldNotGenerateFile') });
    } finally {
      setIsExporting(false);
    }
  };

  const formats: { value: ExportSchema; label: string; version: string }[] = [
    { value: 'single-sheet', label: t('singleSheet'), version: '.xlsx v2' },
    { value: 'three-sheet', label: t('multiSheet'), version: '.xlsx v1' },
  ];

  return (
    <AnchoredPopover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      role="dialog"
      id={id}
      prefer="up"
      aria-labelledby={titleId}
      className="export-popover"
      suspendDismiss={settingsOpen}
    >
      <h3 id={titleId} className="export-popover-title">{t('exportToSpreadsheet')}</h3>

      <div className="export-popover-field">
        <span className="export-popover-kicker" aria-hidden="true">{t('exportSource')}</span>
        <Select
          value={sourceKey(source)}
          options={sourceOptions}
          getOptionLabel={getSourceLabel}
          onChange={(key) => setSource(sourceFromKey(key))}
          aria-label={t('exportSource')}
          className="shared-select-full export-popover-select"
        />
      </div>

      <div className="export-popover-field" role="radiogroup" aria-label={t('exportFormat')}>
        <span className="export-popover-kicker" aria-hidden="true">{t('exportFormat')}</span>
        <div className="export-popover-segment">
          {formats.map((format) => (
            <label key={format.value} className="export-popover-segment-option">
              <input
                type="radio"
                name={formatName}
                value={format.value}
                checked={schema === format.value}
                onChange={() => setSchema(format.value)}
              />
              <span>
                {format.label}
                <small>{format.version}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="export-popover-field">
        <span className="export-popover-kicker" id={fileNameLabelId}>{t('exportFileNameLabel')}</span>
        <output className="export-popover-filename" aria-labelledby={fileNameLabelId} aria-live="polite">
          <bdi dir="auto">{fileName}</bdi>
        </output>
      </div>

      <button
        type="button"
        className="export-popover-disclosure"
        aria-expanded={nameOptionsOpen}
        aria-controls={nameOptionsId}
        onClick={() => setNameOptionsOpen((value) => !value)}
      >
        {t('fileNameOptions')}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <div id={nameOptionsId} className="export-popover-options" hidden={!nameOptionsOpen}>
        <div className="export-popover-field">
          <span className="export-popover-kicker" aria-hidden="true">{t('nameFrom')}</span>
          <Select
            value={namePreset}
            options={presetOptions}
            getOptionLabel={getPresetLabel}
            onChange={(preset) => setNamePreset(preset as FileNamePreset)}
            aria-label={t('nameFrom')}
            className="shared-select-full export-popover-select"
          />
        </div>
        <label className="export-popover-check">
          <input type="checkbox" checked={includeDate} onChange={(e) => setIncludeDate(e.target.checked)} />
          <span>{t('addDate')}</span>
        </label>
        <div className="export-popover-field">
          <label className="export-popover-kicker" htmlFor={customNameId}>{t('customFileName')}</label>
          <input
            id={customNameId}
            className="export-popover-input"
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value.slice(0, MAX_CUSTOM_NAME_LENGTH))}
            maxLength={MAX_CUSTOM_NAME_LENGTH}
            disabled={namePreset !== 'custom'}
          />
        </div>
      </div>

      <div className="export-popover-footer">
        <button type="button" className="export-popover-link" onClick={onOpenSettings}>
          <CogIcon />
          {t('importExportSettings')}
        </button>
        <button
          type="button"
          className="save-panel-btn is-primary"
          onClick={handleExport}
          disabled={isExporting}
          aria-busy={isExporting}
        >
          {t('export')}
        </button>
      </div>
    </AnchoredPopover>
  );
}

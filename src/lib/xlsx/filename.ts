import type { TripSnapshot } from '@/store/types';
import type { ExportOptions } from './types';

export type FilenameOptions = Pick<ExportOptions, 'namePreset' | 'customName' | 'slotLabel' | 'includeDate'>;

/**
 * Builds the downloaded .xlsx file name. The export popover previews the name with this same
 * function, so the preview always matches the file that is written.
 */
export function buildExportFilename(
  snapshot: Pick<TripSnapshot, 'tripId' | 'tripName'>,
  options: FilenameOptions,
  now: Date = new Date(),
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStamp = [
    now.getFullYear(),
    '-',
    pad(now.getMonth() + 1),
    '-',
    pad(now.getDate()),
  ].join('');

  let prefix = '';
  switch (options.namePreset) {
    case 'slotLabel':
      prefix = sanitizeFilename(options.slotLabel ?? '');
      break;
    case 'tripName':
      prefix = sanitizeFilename(snapshot.tripName);
      break;
    case 'custom':
      prefix = sanitizeFilename(options.customName ?? '');
      break;
    case 'tripId':
    default:
      break;
  }

  const baseName = prefix || sanitizeFilename(snapshot.tripId) || 'trip-export';
  const includeDate = options.includeDate ?? true;
  return includeDate ? `${baseName}_${dateStamp}.xlsx` : `${baseName}.xlsx`;
}

export function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

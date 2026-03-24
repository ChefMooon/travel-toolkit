import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const START_ROW_INDEX = 4;
const START_COLUMN_INDEX = 4;

const FORECAST_TYPES = new Set(['festival', 'holiday', 'conference', 'sporting', 'other']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputPath = path.join(projectRoot, 'src', 'features', 'forecast', 'forecastEvents.ts');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function quote(value) {
  return JSON.stringify(value);
}

function toEvent(row, rowNumber) {
  const cells = row.slice(START_COLUMN_INDEX);
  const [
    idRaw = '',
    nameRaw = '',
    locationKeyRaw = '',
    startDateRaw = '',
    endDateRaw = '',
    descriptionRaw = '',
    typeRaw = '',
  ] = cells;

  const id = idRaw.trim();
  const name = nameRaw.trim();
  const locationKey = locationKeyRaw.trim().toLowerCase();
  const startDate = startDateRaw.trim();
  const endDate = endDateRaw.trim();
  const description = descriptionRaw.trim();
  const type = typeRaw.trim().toLowerCase();

  if (!id) {
    return null;
  }

  if (!name || !locationKey || !startDate || !endDate || !description || !type) {
    console.warn(`Skipping row ${rowNumber}: one or more required columns are blank.`);
    return null;
  }

  if (!/^\d{2}-\d{2}$/.test(startDate) || !/^\d{2}-\d{2}$/.test(endDate)) {
    console.warn(`Skipping row ${rowNumber}: dates must use MM-DD format.`);
    return null;
  }

  if (!FORECAST_TYPES.has(type)) {
    console.warn(`Skipping row ${rowNumber}: invalid type "${type}".`);
    return null;
  }

  return {
    id,
    name,
    locationKey,
    startDate,
    endDate,
    description,
    type,
  };
}

function renderEvent(event) {
  return [
    '  {',
    `    id: ${quote(event.id)},`,
    `    name: ${quote(event.name)},`,
    `    locationKey: ${quote(event.locationKey)},`,
    `    startDate: ${quote(event.startDate)},`,
    `    endDate: ${quote(event.endDate)},`,
    `    description: ${quote(event.description)},`,
    `    type: ${quote(event.type)},`,
    '  },',
  ].join('\n');
}

function renderOutput(events) {
  const renderedEvents = events.length > 0
    ? events.map((event) => renderEvent(event)).join('\n')
    : '';

  return `import type { ForecastEvent } from './forecastTypes';

export const FORECAST_EVENTS: ForecastEvent[] = [
${renderedEvents}
];

export function getEventsForRange(locationName: string, dateFrom: string, dateTo: string): ForecastEvent[] {
  const locationKey = locationName.toLowerCase().trim();
  const toMD = (date: string) => date.slice(5);
  const rangeStart = toMD(dateFrom);
  const rangeEnd = toMD(dateTo);

  return FORECAST_EVENTS.filter((event) => {
    if (event.locationKey !== locationKey) {
      return false;
    }

    return event.startDate <= rangeEnd && event.endDate >= rangeStart;
  });
}
`;
}

async function main() {
  const sheetUrl = process.env.FORECAST_SHEET_URL?.trim();

  if (!sheetUrl) {
    console.error('Missing FORECAST_SHEET_URL. Add it to .env for local runs or Actions secret for CI.');
    process.exit(1);
  }

  const response = await fetch(sheetUrl);

  if (!response.ok) {
    console.error(`Failed to fetch CSV (${response.status} ${response.statusText}).`);
    process.exit(1);
  }

  const csvText = await response.text();
  const rows = parseCsv(csvText);
  const events = [];

  for (let index = START_ROW_INDEX; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const event = toEvent(row, index + 1);
    if (event) {
      events.push(event);
    }
  }

  const content = renderOutput(events);
  await writeFile(outputPath, content, 'utf8');

  console.log(`Synced ${events.length} forecast events to src/features/forecast/forecastEvents.ts`);
}

main().catch((error) => {
  console.error('Failed to sync forecast events:', error);
  process.exit(1);
});

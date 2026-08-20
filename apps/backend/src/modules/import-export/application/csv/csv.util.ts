import { Readable } from 'stream';
import { parse, type Options as ParseOptions } from 'csv-parse';
import { stringify, type Stringifier } from 'csv-stringify';

/** Cells starting with these characters can trigger CSV/formula injection. */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Neutralizes CSV/formula injection by prefixing dangerous cells.
 * Leading whitespace is trimmed so a formula cannot hide behind it.
 */
export function sanitizeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const trimmed = raw.trim();
  if (FORMULA_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return `'${raw}`;
  }
  return raw;
}

export type ParsedRow = Record<string, string | null>;

export type ParseResult = {
  rows: ParsedRow[];
  header: string[];
  errors: { row: number; message: string }[];
};

const PARSE_OPTIONS: ParseOptions = {
  columns: false,
  skip_empty_lines: true,
  trim: true,
  bom: true,
  relax_column_count: false,
  cast: (value) => (value === '' ? null : value),
};

/**
 * Parses a CSV stream without buffering the whole file.
 * The first record is the header; subsequent records map to objects.
 * Enforces a hard row limit to bound memory usage.
 */
export async function parseCsvStream(
  input: Readable,
  options: { maxRows: number; expectedColumns: string[] },
): Promise<ParseResult> {
  const rows: ParsedRow[] = [];
  const errors: { row: number; message: string }[] = [];
  let header: string[] = [];
  let dataRowCount = 0;

  const parser = input.pipe(parse(PARSE_OPTIONS));

  await new Promise<void>((resolve, reject) => {
    parser.on('data', (record: unknown[]) => {
      if (header.length === 0) {
        header = record.map(String).map((column) => column.trim());
        return;
      }
      dataRowCount += 1;
      if (dataRowCount > options.maxRows) {
        reject(new Error(`Exceeded maximum of ${options.maxRows} data rows`));
        return;
      }
      const row: ParsedRow = {};
      for (let index = 0; index < header.length; index += 1) {
        const column = header[index];
        if (column === undefined) continue;
        const value = record[index];
        row[column] = value === null || value === undefined ? null : String(value);
      }
      rows.push(row);
    });

    parser.on('error', (error: Error) => reject(error));

    parser.on('end', () => resolve());
  });

  if (header.length === 0) {
    throw new Error('CSV is empty or missing a header row');
  }

  const missing = options.expectedColumns.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }

  return { rows, header, errors };
}

/**
 * Streaming CSV writer with formula-injection sanitization.
 * The returned stringifier is a Writable that the caller can pipe to the response.
 */
export function createCsvSerializer(): Stringifier {
  return (stringify as (options?: Record<string, unknown>) => Stringifier)({
    header: true,
    quoted: true,
    cast: (value: unknown) => sanitizeCsvCell(value),
  });
}
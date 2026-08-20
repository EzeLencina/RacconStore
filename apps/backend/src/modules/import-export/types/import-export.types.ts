import type { ParsedRow } from '../application/csv/csv.util';

export type ImportAction = 'CREATE' | 'UPDATE' | 'NOOP';

export type NormalizedImportRow = {
  row: number;
  slug: string;
  name: string | null;
  sku: string;
  action: ImportAction;
  data: ParsedRow;
  typed: Record<string, unknown>;
  errors: string[];
};

export type ImportRowError = {
  row: number;
  sku: string;
  slug: string;
  errors: string[];
};

export type ImportPreview = {
  importId: string;
  mode: 'CREATE' | 'UPDATE' | 'UPSERT';
  summary: ImportSummary;
  rows: NormalizedImportRow[];
};

export type ImportSummary = {
  total: number;
  valid: number;
  invalid: number;
  toCreate: number;
  toUpdate: number;
  noop: number;
  errors: ImportRowError[];
};

export type ImportResult = {
  importId: string;
  applied: boolean;
  created: number;
  updated: number;
  noop: number;
  errors: ImportRowError[];
};

export type ExportRow = Record<string, unknown>;

export type ExportOptions = {
  tenantId: string;
  status?: string;
  search?: string;
};
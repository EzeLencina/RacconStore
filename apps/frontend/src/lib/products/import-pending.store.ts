import type { ImportConfirmResult, ImportMode, NormalizedRow } from './import-export.types';

const TTL_MS = 10 * 60 * 1000;

type PendingImport = {
  tenantId: string;
  mode: ImportMode;
  rows: NormalizedRow[];
  createdAt: number;
};

type Store = {
  pending: Map<string, PendingImport>;
  results: Map<string, ImportConfirmResult>;
};

function getStore(): Store {
  const key = '__productImportStore';
  const global = globalThis as typeof globalThis & { [key]: Store | undefined };
  if (!global[key]) {
    global[key] = { pending: new Map(), results: new Map() };
  }
  return global[key];
}

export function setPendingImport(importId: string, entry: PendingImport): void {
  getStore().pending.set(importId, entry);
}

export function getPendingImport(importId: string): PendingImport | undefined {
  const entry = getStore().pending.get(importId);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > TTL_MS) {
    getStore().pending.delete(importId);
    return undefined;
  }
  return entry;
}

export function completeImport(importId: string, result: ImportConfirmResult): void {
  getStore().pending.delete(importId);
  getStore().results.set(importId, result);
}

export function getCompletedImport(importId: string): ImportConfirmResult | undefined {
  return getStore().results.get(importId);
}
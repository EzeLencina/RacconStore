import { Injectable } from '@nestjs/common';
import type { NormalizedImportRow, ImportSummary, ImportResult } from '../types/import-export.types';

type PendingImport = {
  tenantId: string;
  rows: NormalizedImportRow[];
  summary: ImportSummary;
  createdAt: number;
};

/**
 * In-memory store for pending imports (preview -> confirm).
 * No Redis needed: single-instance, short TTL, bounded by limits.
 */
@Injectable()
export class PendingImportStore {
  private readonly pending = new Map<string, PendingImport>();
  private readonly results = new Map<string, ImportResult>();
  private readonly ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  set(importId: string, entry: PendingImport): void {
    this.cleanup();
    this.pending.set(importId, entry);
  }

  get(importId: string): PendingImport | undefined {
    const entry = this.pending.get(importId);
    if (!entry) return undefined;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.pending.delete(importId);
      return undefined;
    }
    return entry;
  }

  /** Marks an import as applied so confirm is idempotent. */
  complete(importId: string, result: ImportResult): void {
    this.pending.delete(importId);
    this.results.set(importId, result);
  }

  getResult(importId: string): ImportResult | undefined {
    return this.results.get(importId);
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.ttlMs;
    for (const [id, entry] of this.pending) {
      if (entry.createdAt < cutoff) this.pending.delete(id);
    }
  }
}
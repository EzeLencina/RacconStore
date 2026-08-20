export const IMPORT_EXPORT_CONSTANTS = {
  /** Max CSV file size in bytes (1 MB). */
  MAX_FILE_SIZE_BYTES: 1_000_000,
  /** Max number of data rows per file. */
  MAX_ROWS: 2_000,
  /** Rows per DB transaction batch. */
  BATCH_SIZE: 100,
  /** Natural identifier used to upsert products (product-level). */
  PRODUCT_KEY: 'slug',
  /** Natural identifier used to upsert variants (variant-level). */
  VARIANT_KEY: 'sku',
  /** Pending import TTL in milliseconds (10 min). */
  PENDING_TTL_MS: 10 * 60 * 1000,
} as const;

export const EXPORT_COLUMNS = [
  'slug',
  'name',
  'shortDescription',
  'description',
  'productType',
  'status',
  'visibility',
  'condition',
  'warrantyMonths',
  'seoTitle',
  'seoDescription',
  'sku',
  'variantName',
  'barcode',
  'variantStatus',
  'isDefault',
  'attributes',
  'costAmount',
  'listAmount',
  'saleAmount',
  'promotionalAmount',
  'promotionalStartsAt',
  'promotionalEndsAt',
  'onHand',
  'minimumStock',
] as const;

export type ExportColumn = (typeof EXPORT_COLUMNS)[number];

export const PRODUCT_TYPES = ['PHYSICAL', 'DIGITAL', 'SERVICE', 'BUNDLE'] as const;
export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export const PRODUCT_VISIBILITIES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const;
export const PRODUCT_CONDITIONS = ['NEW', 'REFURBISHED', 'USED'] as const;
export const VARIANT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
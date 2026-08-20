import {
  CATALOG_STATUSES,
  CATALOG_VISIBILITIES,
  COLLECTION_TYPES,
  BRAND_STATUSES,
  BRAND_VISIBILITIES,
  type CatalogField,
} from './catalog';

export const CATEGORY_FIELDS: CatalogField[] = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'slug', label: 'Slug (opcional)', type: 'text' },
  { key: 'parentId', label: 'Categoría padre', type: 'parent' },
  { key: 'shortDescription', label: 'Descripción corta', type: 'text' },
  { key: 'description', label: 'Descripción', type: 'textarea' },
  { key: 'status', label: 'Estado', type: 'select', options: CATALOG_STATUSES },
  { key: 'visibility', label: 'Visibilidad', type: 'select', options: CATALOG_VISIBILITIES },
  { key: 'displayOrder', label: 'Orden', type: 'number' },
  { key: 'icon', label: 'Icono (URL)', type: 'text' },
  { key: 'image', label: 'Imagen (URL)', type: 'text' },
  { key: 'seoTitle', label: 'Título SEO', type: 'text' },
  { key: 'seoDescription', label: 'Descripción SEO', type: 'textarea' },
];

export const BRAND_FIELDS: CatalogField[] = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'slug', label: 'Slug (opcional)', type: 'text' },
  { key: 'description', label: 'Descripción', type: 'textarea' },
  { key: 'logoUrl', label: 'Logo (URL)', type: 'text' },
  { key: 'websiteUrl', label: 'Sitio web', type: 'text' },
  { key: 'status', label: 'Estado', type: 'select', options: BRAND_STATUSES },
  { key: 'visibility', label: 'Visibilidad', type: 'select', options: BRAND_VISIBILITIES },
  { key: 'seoTitle', label: 'Título SEO', type: 'text' },
  { key: 'seoDescription', label: 'Descripción SEO', type: 'textarea' },
];

export const COLLECTION_FIELDS: CatalogField[] = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'slug', label: 'Slug (opcional)', type: 'text' },
  { key: 'description', label: 'Descripción', type: 'textarea' },
  { key: 'type', label: 'Tipo', type: 'select', options: COLLECTION_TYPES },
  { key: 'status', label: 'Estado', type: 'select', options: CATALOG_STATUSES },
  { key: 'visibility', label: 'Visibilidad', type: 'select', options: CATALOG_VISIBILITIES },
  { key: 'displayOrder', label: 'Orden', type: 'number' },
  { key: 'startAt', label: 'Inicio', type: 'date' },
  { key: 'endAt', label: 'Fin', type: 'date' },
  { key: 'seoTitle', label: 'Título SEO', type: 'text' },
  { key: 'seoDescription', label: 'Descripción SEO', type: 'textarea' },
];
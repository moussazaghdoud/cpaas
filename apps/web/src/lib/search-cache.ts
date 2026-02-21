/* eslint-disable @typescript-eslint/no-explicit-any */

/** Module-level cache for the search index, shared across route files */
let _cache: any = null;

export function getSearchCache(): any {
  return _cache;
}

export function setSearchCache(index: any): void {
  _cache = index;
}

/** Invalidate the cached search index (called by CMS on save/delete) */
export function invalidateSearchIndex(): void {
  _cache = null;
}

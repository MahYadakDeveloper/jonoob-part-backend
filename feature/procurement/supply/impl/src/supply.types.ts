import { Page, Pagination } from '@feature/common';

export interface DocumentCriteria {
  filters?: DocumentFilters;

  sort?: DocumentSort;

  page?: Pagination;
}

export interface DocumentResult {
  page: Page<DocumentPageItem>;
}

export interface DocumentFilters {}

export interface DocumentSort {
  field: DocumentSortField;

  direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc';

export type DocumentSortField = 'createdAt';

export interface DocumentPageItem {
  // ...
}

import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from './pagination-type';

export interface PageCriteria<T extends CursorPagination | OffsetPagination> {
  filters?: PageFilters;

  sort?: PageSort;

  page: T;
}

export interface PageResult<T, TPagination extends Pagination> {
  page: Page<T, TPagination>;
}

export interface PageFilters {}

export interface PageSort {
  field: PageSortField;

  direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc';

export type PageSortField = 'createdAt';

export type Page<
  T,
  TPagination extends Pagination,
> = TPagination extends OffsetPagination
  ? OffsetPage<T>
  : TPagination extends CursorPagination
    ? CursorPage<T>
    : never;

export interface OffsetPage<T> {
  items: readonly T[];

  number: number;
  size: number;
  totalItems: number;
  totalPages: number;

  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CursorPage<T> {
  items: readonly T[];

  size: number;
  hasNext: boolean;
  hasPrevious: boolean;

  nextCursor?: string;
}

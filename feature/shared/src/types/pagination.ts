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

export type Pagination = OffsetPagination | CursorPagination;

export interface OffsetPagination {
  type: 'offset';

  page: number;

  size: number;
}

export interface CursorPagination {
  type: 'cursor';

  after?: string;

  size: number;
}

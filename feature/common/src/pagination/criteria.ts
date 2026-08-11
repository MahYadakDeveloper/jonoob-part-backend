import { Page } from './page';
import { Pagination } from './pagination-type';

export interface PageCriteria {
  filters?: PageFilters;

  sort?: PageSort;

  page?: Pagination;
}

export interface PageResult<T> {
  page: Page<T>;
}

export interface PageFilters {}

export interface PageSort {
  field: PageSortField;

  direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc';

export type PageSortField = 'createdAt';

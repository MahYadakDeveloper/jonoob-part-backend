import { MediaRef } from '@feature/common';

export interface ProductSearchFilters {
  brandIds?: readonly string[];

  categoryIds?: readonly string[];

  fitmentId?: string;

  inStock?: boolean;

  minPrice?: number;

  maxPrice?: number;
}

export interface ProductSearchSort {
  field: ProductSortField;

  direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc';

export type ProductSortField = 'relevance' | 'price' | 'createdAt' | 'popularity' | 'name';

export interface SearchPageInfo {
  number: number;

  size: number;

  totalItems: number;

  totalPages: number;

  hasNext: boolean;

  hasPrevious: boolean;
}

export interface SearchPage<T> extends SearchPageInfo {
  items: readonly T[];
}

export type SearchPagination = OffsetPagination | CursorPagination;

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

export interface SearchFacets {
  brands?: readonly SearchFacet[];

  categories?: readonly SearchFacet[];
}

export interface SearchFacet {
  id: string;

  count: number;
}

export interface ProductSearchPageItem {
  id: string;
  displayName: string;
  image: MediaRef;
  brand: {
    name: string;
    logo: MediaRef;
  };
}

import { ProductSearchFilters, ProductSearchSort, SearchPagination } from './search.interfaces';

export interface ProductSearchRequest {
  query?: string;

  filters?: ProductSearchFilters;

  sort?: ProductSearchSort;

  page?: SearchPagination;
}

import { ProductSearchRequest } from './search.req';
import { ProductSearchResponse } from './search.res';

export interface ProductSearchEngine {
  search(request: ProductSearchRequest): Promise<ProductSearchResponse>;

  // [NOTE] There no setting indices for searching because the (product + indices) are combined.
}

import { ProductSearchPageItem, SearchPage } from './search.interfaces';

export interface ProductSearchResponse {
  page: SearchPage<ProductSearchPageItem>;
}

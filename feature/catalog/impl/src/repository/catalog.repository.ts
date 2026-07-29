import { LineItems } from '@feature/common';
import { ProductData } from 'catalog.types';
import { Product } from 'model/product';
import { ProductSearchCriteria, ProductSearchResult } from './search';

export interface CatalogRepository {
  findById(id: string): Promise<Product | null>;
  findManyById(ids: string[]): Promise<LineItems<Product>>;
  findByGoodId(id: string): Promise<Product | null>;
  search(criteria: ProductSearchCriteria): Promise<ProductSearchResult>;

  create(data: ProductData): Promise<{ id: string }>;

  update(id: string, data: ProductData): Promise<void>;
}

import { DeepPartial, LineItems } from '@feature/common';
import { CreateProduct, UpdateProduct } from 'catalog.types';
import { Product } from 'model/product';
import { ProductSearchCriteria, ProductSearchResult } from './search';

export interface CatalogRepository {
  find(filter: { where: DeepPartial<Product> }): Promise<LineItems<Product>>;
  findById(id: string): Promise<Product | null>;
  findManyById(ids: string[]): Promise<LineItems<Product>>;
  findByGoodId(id: string): Promise<Product | null>;
  search(criteria: ProductSearchCriteria): Promise<ProductSearchResult>;

  create(data: CreateProduct): Promise<{ id: string }>;

  update(id: string, data: UpdateProduct): Promise<void>;
}

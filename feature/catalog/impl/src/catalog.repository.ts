import { LineItems } from '@feature/common';
import { Product } from 'model/product';

export interface CatalogRepository {
  findProductByIds(ids: string[]): Promise<LineItems<Product>>;
  findProductByGoodId(id: string): Promise<Product | null>;
}

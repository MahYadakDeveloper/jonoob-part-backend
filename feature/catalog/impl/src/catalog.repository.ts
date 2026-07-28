import { LineItems } from '@feature/common';
import { Product } from 'model/product';

export interface CatalogRepository {
  findMany(ids: string[]): Promise<LineItems<Product>>;
  findByGoodId(id: string): Promise<Product | null>;
}

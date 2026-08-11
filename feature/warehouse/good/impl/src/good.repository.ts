import { Barcode, LineItems } from '@feature/common';
import { Good } from './model/good';

export interface WarehouseGoodRepository {
  find(id: string): Promise<Good>;
  findMany(ids: string[]): Promise<LineItems<Good>>;
  findByBarcode(barcode: Barcode): Promise<Good>;
  create(good: Omit<Good, 'goodId'>): Promise<string>;
  update(good: Good): Promise<void>;
  delete(goodId: string): Promise<void>;
}

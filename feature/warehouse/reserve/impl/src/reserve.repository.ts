import { LineItems } from '@feature/common';
import { Stock } from './model/reserve';

export interface ReserveRepository {
  reserve(stock: LineItems<Stock>);
  release(stock: LineItems<Stock>);
}

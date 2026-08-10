import { LineItems } from '@feature/common';
import { Good } from './good.type';

export interface FindGoodResponse {
  good: Good;
}

export interface FindManyGoodResponse {
  goods: LineItems<Good>;
}

export interface FindGoodByBarcodeResponse {
  good: Good;
}

export interface GoodCreationResponse {
  goodId: string;
}

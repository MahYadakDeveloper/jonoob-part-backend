import { Barcode } from '@feature/common';
import { Good } from './good.type';

export interface FindGoodRequest {
  goodId: string;
}

export interface FindManyGoodRequest {
  goodIds: string[];
}

export interface FindGoodByBarcodeRequest {
  barcode: Barcode;
}

export interface GoodCreationRequest {
  good: Good;
}

export interface GoodUpdatingRequest {
  good: Good;
}

export interface GoodDeletionRequest {
  goodId: string;
}

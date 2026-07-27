import { Barcode } from '@feature/common';
import { Populate } from 'catalog.types';

export interface FindProductByBarcodeRequest {
  barcode: Barcode;
  populate: Populate;
}

export interface FindProductRequest {
  productId: string;
  populate: Populate;
}

export interface FindManyProductRequest {
  productIds: string[];
  populate: Populate;
}

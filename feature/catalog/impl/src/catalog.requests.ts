import { Barcode, PartialBy } from '@feature/common';
import { Populate } from 'catalog.types';
import { Product } from 'model/product';

export interface FindByBarcodeRequest {
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

// [TODO] Move media upload orchestration to the controller and let this method accept only MediaRef values.
export type DefiningProductRequest = {
  // We didn't omit the id because of type narrowing
  definitions: PartialBy<Product, 'id' | 'displayName'>;
};

export type RedefiningProductRequest = Partial<Product>;

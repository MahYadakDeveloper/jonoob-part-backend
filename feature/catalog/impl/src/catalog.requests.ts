import { Barcode } from '@feature/common';
import { Populate, ProductDefinitions } from 'catalog.types';
import { Product } from 'model/product';

export interface FindByBarcodeRequest {
  barcode: Barcode;
  populate: Populate;
}

export interface FindProductRequest {
  productId: string;
  online?: true | false;
  populate: Populate;
}

export interface FindManyProductRequest {
  productIds: string[];
  online?: true | false;
  populate: Populate;
}

// [TODO] Move media upload orchestration to the controller and let this method accept only MediaRef values.
export type DefiningProductRequest = {
  // We didn't omit the id because of type narrowing
  definitions: ProductDefinitions;
};

export type RedefiningProductRequest = {
  productId: string;
  definitions: ProductDefinitions;
};

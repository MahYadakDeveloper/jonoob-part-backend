export interface RawProductsRequest {
  productIds: string[];
}

export interface FindProductRequest {
  productId: string;
}

export interface FindManyProductRequest {
  productIds: string[];
}

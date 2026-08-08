export interface RawProductsRequest {
  productIds: string[];
}

export interface FindProductRequest {
  productId: string;
}

export interface FindManyProductRequest {
  productIds: string[];
}

export interface FindProductByBrandRequest {
  brandId: string;
}

export interface FindProductByCategoryRequest {
  categoryId: string;
}

export interface FindManyProductByGoodIdRequest {
  goodIds: string[];
}

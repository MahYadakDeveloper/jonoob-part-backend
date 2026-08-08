import { LineItems, RawProduct } from '@feature/common';
import { ProductDto } from './catalog.dto';

export interface FindProductResponse {
  product: ProductDto;
}

export interface RawProductsResponse {
  products: LineItems<RawProduct>;
}

export interface FindManyProductResponse {
  products: LineItems<ProductDto>;
}

export interface FindProductByBrandResponse {
  products: LineItems<ProductDto>;
}
export interface FindProductByCategoryResponse {
  products: LineItems<ProductDto>;
}

export interface FindManyProductByGoodIdResponse {
  products: LineItems<ProductDto>;
}

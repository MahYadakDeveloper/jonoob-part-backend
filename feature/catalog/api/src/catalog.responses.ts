import { LineItems, RawProduct } from '@feature/common';
import { ProductDto } from './catalog.dto';

export interface RawProductsResponse {
  products: LineItems<RawProduct>;
}

export interface FindProductResponse {
  product: ProductDto;
}

export interface FindManyProductResponse {
  products: LineItems<ProductDto>;
}

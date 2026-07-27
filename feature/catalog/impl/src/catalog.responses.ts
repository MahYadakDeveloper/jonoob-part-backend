import { LineItems } from '@feature/common';
import { ProductDto } from 'dto/product-dto';

export interface FindProductByBarcodeResponse {
  product: ProductDto;
}

export interface FindProductResponse {
  product: ProductDto;
}

export interface FindManyProductResponse {
  products: LineItems<ProductDto>;
}

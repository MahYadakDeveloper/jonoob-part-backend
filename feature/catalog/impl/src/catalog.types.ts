import { LineItems } from '@feature/common';
import { ProductDto } from 'dto/product-dto';

export type Populate = {
  fitments?: true;
  categories?: true;
  brand?: true;
};

export type ProductPatch = Partial<ProductDto> & { id: string };

export type ProductPopulatePatch = LineItems<ProductPatch>;

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isNotFound<T>(x: T | null): boolean {
  return x === null || x === undefined;
}

import { LineItems } from '@feature/common';
import { BrandDto } from './brand.dto';

export interface FindBrandResponse {
  brand: BrandDto | null;
}

export interface FindManyBrandResponse {
  brands: LineItems<BrandDto>;
}

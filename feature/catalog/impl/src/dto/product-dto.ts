import { BrandDto } from '@feature/brand-api';
import { CategoryDto } from '@feature/category-api';
import { FitmentDto } from '@feature/fitment-api';
import { ProductQuality } from 'model/product';

export interface ProductDto {
  id: string;
  displayName: string;
  canonicalName: string;
  aliases: string[];
  brand?: BrandDto;
  categories?: CategoryDto[];
  fitments?: FitmentDto[];
  emplacement?: string;
  quality?: ProductQuality;
}

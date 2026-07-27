import { BrandDto } from '@feature/brand-api';
import { CategoryDto } from '@feature/category-api';
import { FitmentDto } from '@feature/fitment-api';
import { ProductQuality } from 'model/product';

export interface ProductDto {
  displayName: string;
  canonicalName: string;
  aliases: string[];
  brand?: BrandDto;
  category?: CategoryDto;
  fitment?: FitmentDto;
  emplacement?: string;
  quality?: ProductQuality;
}

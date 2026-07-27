import { BrandDto } from './brand.dto';

export interface BrandApi {
  findById(id: string): Promise<BrandDto>;
}

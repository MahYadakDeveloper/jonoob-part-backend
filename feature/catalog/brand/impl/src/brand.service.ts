import {
  BrandApi,
  FindBrandRequest,
  FindBrandResponse,
  FindManyBrandRequest,
  FindManyBrandResponse,
} from '@feature/catalog.brand-api';
import { Injectable } from '@nestjs/common';
import { type BrandRepository } from './brand.repository';
import { BrandCreationRequest, BrandDeletionRequest, BrandUpdatingRequest } from './brand.req';

@Injectable()
export class BrandService implements BrandApi {
  constructor(private readonly repository: BrandRepository) {}
  async findOne({ brandId }: FindBrandRequest): Promise<FindBrandResponse> {
    const brand = await this.repository.findById(brandId);
    if (!brand) throw new Error(`Not found brand ${brandId}`);
    return { brand };
  }

  async findMany({ brandIds }: FindManyBrandRequest): Promise<FindManyBrandResponse> {
    const brands = await this.repository.findManyByIds(brandIds);
    return { brands };
  }

  async createOne({ brandDto }: BrandCreationRequest): Promise<void> {
    return this.repository.create(brandDto);
  }

  async deleteOne({ brandId }: BrandDeletionRequest): Promise<void> {
    return this.repository.delete(brandId);
  }

  async updateOne({ brandId, brandDto }: BrandUpdatingRequest): Promise<void> {
    const brand = await this.repository.findById(brandId);

    if (!brand) throw new Error(`Not found brand ${brandId}`);

    return this.repository.update(brandId, brandDto);
  }
}

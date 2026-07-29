import { FindBrandRequest, FindManyBrandRequest } from './brand.req';
import { FindBrandResponse, FindManyBrandResponse } from './brand.res';

export interface BrandApi {
  findOne(request: FindBrandRequest): Promise<FindBrandResponse>;
  findMany(request: FindManyBrandRequest): Promise<FindManyBrandResponse>;
}

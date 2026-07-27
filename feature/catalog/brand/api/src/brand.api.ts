import { FindBrandRequest, FindManyBrandRequest } from './brand.req';
import { FindBrandResponse, FindManyBrandResponse } from './brand.res';

export interface BrandApi {
  findById(request: FindBrandRequest): Promise<FindBrandResponse>;
  findManyByIds(request: FindManyBrandRequest): Promise<FindManyBrandResponse>;
}

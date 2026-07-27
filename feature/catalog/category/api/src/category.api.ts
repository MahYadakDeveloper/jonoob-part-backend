import { FindManyRequest, FindOneRequest } from './category.req';
import { FindManyResponse, FindOneResponse } from './category.res';

export interface CategoryApi {
  findById(request: FindOneRequest): Promise<FindOneResponse>;
  findManyByIds(request: FindManyRequest): Promise<FindManyResponse>;
}

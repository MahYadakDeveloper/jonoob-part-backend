import { FindManyProductRequest, FindProductRequest, RawProductsRequest } from './catalog.requests';
import {
  FindManyProductResponse,
  FindProductResponse,
  RawProductsResponse,
} from './catalog.responses';

export interface CatalogApi {
  getRawProducts(request: RawProductsRequest): Promise<RawProductsResponse>;
  find(req: FindProductRequest): Promise<FindProductResponse>;
  findMany(req: FindManyProductRequest): Promise<FindManyProductResponse>;
}

import {
  FindManyProductRequest,
  FindProductByBrandRequest,
  FindProductByCategoryRequest,
  FindProductRequest,
  RawProductsRequest,
} from './catalog.requests';
import {
  FindManyProductResponse,
  FindProductByBrandResponse,
  FindProductByCategoryResponse,
  FindProductResponse,
  RawProductsResponse,
} from './catalog.responses';

export interface CatalogApi {
  getRawProducts(request: RawProductsRequest): Promise<RawProductsResponse>;
  find(req: FindProductRequest): Promise<FindProductResponse>;
  findMany(req: FindManyProductRequest): Promise<FindManyProductResponse>;
  findByBrand(req: FindProductByBrandRequest): Promise<FindProductByBrandResponse>;
  findByCategory(req: FindProductByCategoryRequest): Promise<FindProductByCategoryResponse>;
}

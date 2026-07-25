import { RawProductsRequest } from "./catalog.requests";
import { RawProductsResponse } from "./catalog.responses";

export interface CatalogApi {
  getRawProducts(request: RawProductsRequest): Promise<RawProductsResponse>;
}

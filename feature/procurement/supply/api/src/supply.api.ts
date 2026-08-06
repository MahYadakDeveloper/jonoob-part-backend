import { FindLatestPurchasePriceRequest, FindManyLatestPurchasePriceRequest } from './supply.req';
import { FindLatestPurchasePriceResponse, FindManyLatestPurchasePriceResponse } from './supply.res';

export interface SupplyApi {
  findLatestPurchasePrice(
    req: FindLatestPurchasePriceRequest,
  ): Promise<FindLatestPurchasePriceResponse>;

  findManyLatestPurchasePrice(
    req: FindManyLatestPurchasePriceRequest,
  ): Promise<FindManyLatestPurchasePriceResponse>;
}

import {
  FindLatestPurchasePriceRequest,
  FindManyLatestPurchasePriceRequest,
  SupplyReturnRequest,
} from './supply.req';
import {
  FindLatestPurchasePriceResponse,
  FindManyLatestPurchasePriceResponse,
  SupplyReturnResponse,
} from './supply.res';

export interface SupplyApi {
  findLatestPurchasePrice(
    req: FindLatestPurchasePriceRequest,
  ): Promise<FindLatestPurchasePriceResponse>;

  findManyLatestPurchasePrice(
    req: FindManyLatestPurchasePriceRequest,
  ): Promise<FindManyLatestPurchasePriceResponse>;

  returnSupply(req: SupplyReturnRequest): Promise<SupplyReturnResponse>;
}

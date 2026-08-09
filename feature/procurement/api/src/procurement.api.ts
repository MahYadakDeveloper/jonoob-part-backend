import {
  ManyProductPurchasePriceRequest,
  ProductPurchasePriceRequest,
  SupplyReturnRequest,
} from './procurement.req';
import {
  ManyProductPurchasePriceResponse,
  ProductPurchasePriceResponse,
  SupplyReturnResponse,
} from './procurement.res';

export interface ProcurementApi {
  findPurchasePrice(req: ProductPurchasePriceRequest): Promise<ProductPurchasePriceResponse>;
  findManyPurchasePrice(
    req: ManyProductPurchasePriceRequest,
  ): Promise<ManyProductPurchasePriceResponse>;

  returnSupply(req: SupplyReturnRequest): Promise<SupplyReturnResponse>;
}

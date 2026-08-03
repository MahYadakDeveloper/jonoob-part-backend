import { ManyProductPurchasePriceRequest, ProductPurchasePriceRequest } from './procurement.req';
import { ManyProductPurchasePriceResponse, ProductPurchasePriceResponse } from './procurement.res';

export interface ProcurementApi {
  findPurchasePrice(req: ProductPurchasePriceRequest): Promise<ProductPurchasePriceResponse>;
  findManyPurchasePrice(
    req: ManyProductPurchasePriceRequest,
  ): Promise<ManyProductPurchasePriceResponse>;
}

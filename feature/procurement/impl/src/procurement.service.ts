import { ManyProductPurchasePriceRequest, ManyProductPurchasePriceResponse, ProductPurchasePriceRequest, ProductPurchasePriceResponse, type ProcurementApi} from '@feature/procurement-api'
import { Injectable } from '@nestjs/common';

@Injectable() 
export class ProcurementService implements ProcurementApi{
  constructor()
  findPurchasePrice(req: ProductPurchasePriceRequest): Promise<ProductPurchasePriceResponse> {
    throw new Error('Method not implemented.');
  }
  findManyPurchasePrice(req: ManyProductPurchasePriceRequest): Promise<ManyProductPurchasePriceResponse> {
    throw new Error('Method not implemented.');
  }
}
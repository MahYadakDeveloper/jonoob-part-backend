import { ReturnSnapshot, SaleReturn } from "model/sale-return";

export interface ISaleReturnDocumentsRepository {
  recordReturn(saleReturn: ReturnSnapshot): Promise<{ saleReturnId: string }>;
  findById(saleId: string): Promise<SaleReturn>;
}

import { ReturnSnapshot } from "@feature/sale-api";
import { SaleReturn } from "model/sale-return";

export interface SaleReturnDocumentsRepository {
  recordReturn(saleReturn: ReturnSnapshot): Promise<{ saleReturnId: string }>;
  findById(saleId: string): Promise<SaleReturn>;
}

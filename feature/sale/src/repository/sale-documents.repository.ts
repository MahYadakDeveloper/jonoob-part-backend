import { InvoiceSnapshot } from "@feature/common";
import { Sale } from "model/sale";
import { ReturnSnapshot, SaleReturn } from "model/sale-return";

export interface ISaleDocumentsRepository {
  recordSale(invoice: Required<InvoiceSnapshot>): Promise<{ saleId: string }>;
  recordReturn(saleReturn: ReturnSnapshot): Promise<{ saleReturnId: string }>;
  findSaleById(saleId: string): Promise<Sale>;
}

import { InvoiceSnapshot } from "@feature/common";
import { Return } from "model/return";
import { Sale } from "model/sale";

export interface ISaleDocumentsRepository {
  recordSale(invoice: Required<InvoiceSnapshot>): Promise<{ saleId: string }>;
  recordReturn(document: Return): Promise<void>;
  findSaleById(saleId: string): Promise<Sale>;
}

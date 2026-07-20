import { InvoiceSnapshot } from "@feature/common";
import { Sale } from "model/sale";

export interface SaleDocumentsRepository {
  recordSale(invoice: Required<InvoiceSnapshot>): Promise<{ saleId: string }>;
  findById(saleId: string): Promise<Sale>;
}

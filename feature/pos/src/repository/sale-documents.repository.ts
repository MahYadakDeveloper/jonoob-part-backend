import { SaleInvoice } from "domain/value-object/sale-invoice";

export interface ISaleDocumentsRepository {
  save(invoice: SaleInvoice): Promise<void>
}
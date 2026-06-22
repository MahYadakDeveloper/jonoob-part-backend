import { SaleInvoice } from "domain/entities/sale-invoice";

export interface ISaleDocumentsRepository {
  save(invoice: SaleInvoice): Promise<void>
}
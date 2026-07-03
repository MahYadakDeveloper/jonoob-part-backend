import { Invoice } from "@feature/common";

export interface ISaleDocumentsRepository {
  recordInvoice(invoice: Invoice): Promise<void>
  recordReturn()
}
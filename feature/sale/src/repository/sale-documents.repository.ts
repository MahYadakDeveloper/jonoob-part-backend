import { Return } from "model/return";
import { Sale } from "model/sale";

export interface ISaleDocumentsRepository {
  recordSale(document: Omit<Sale, "id">): Promise<{saleId: string}>;
  recordReturn(document: Return): Promise<void>;
  findSaleById(saleId: string): Promise<Sale>;
}

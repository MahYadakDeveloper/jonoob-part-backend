import { ReturnDocument } from "model/return-document";
import { SaleDocument } from "model/sale-document";

export interface ISaleDocumentsRepository {
  recordSale(document: SaleDocument): Promise<void>;
  recordReturn(document: ReturnDocument): Promise<void>;
}

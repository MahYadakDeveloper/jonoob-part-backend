import { Return } from "model/return";
import { Sale } from "model/sale";

export interface ISaleDocumentsRepository {
  recordSale(document: Sale): Promise<void>;
  recordReturn(document: Return): Promise<void>;
}

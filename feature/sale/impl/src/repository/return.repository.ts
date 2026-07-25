import { ReturnSnapshot } from "@feature/sale-api";
import { SaleReturn } from "model/sale-return";

export interface ReturnRepository {
  recordReturn(snapshot: Required<ReturnSnapshot>): Promise<{ returnId: string }>;
  findById(saleId: string): Promise<SaleReturn>;
}

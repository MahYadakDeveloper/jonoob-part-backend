import { NewSettlementRequest, SettlementRequest } from "type";

export interface SettlementRepository {
  createRequest(request: NewSettlementRequest): Promise<void>;
  getOrThrow(id: string): Promise<SettlementRequest>;
  markPaid(id: string, receiptText: string): Promise<void>;
  markRejected(id: string, reason: string): Promise<void>;
}

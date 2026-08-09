import { QuarantineStockRequest } from './quarantine.req';

export interface StockQuarantineApi {
  quarantine(req: QuarantineStockRequest): Promise<void>;
}

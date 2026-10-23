import { RecordSupplyReturnRequest } from './supply-return.req';
import { RecordSupplyReturnResponse } from './supply-return.res';

export interface SupplyReturnApi {
  recordSupplyReturn(req: RecordSupplyReturnRequest): Promise<RecordSupplyReturnResponse>;
}

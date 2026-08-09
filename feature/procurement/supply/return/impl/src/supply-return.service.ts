import {
  RecordSupplyReturnRequest,
  RecordSupplyReturnResponse,
  SupplyReturnApi,
} from '@feature/procurement-supply-return-api';
export class SupplyReturnService implements SupplyReturnApi {
  recordSupplyReturn(req: RecordSupplyReturnRequest): Promise<RecordSupplyReturnResponse> {
    throw new Error('Method not implemented.');
  }
}

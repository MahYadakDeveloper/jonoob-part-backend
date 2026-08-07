import { LineItems } from '@feature/common';
import { PurchaseRecordDto } from './purchase-record.dto';

export interface FindLatestRecordByGoodIdResponse {
  record: PurchaseRecordDto;
}

export interface FindManyLatestRecordByGoodIdResponse {
  records: LineItems<PurchaseRecordDto>;
}

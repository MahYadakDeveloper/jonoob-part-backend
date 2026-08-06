import {
  FindLatestRecordByGoodIdRequest,
  FindManyLatestRecordByGoodIdRequest,
} from './purchase-record.req';
import {
  FindLatestRecordByGoodIdResponse,
  FindManyLatestRecordByGoodIdResponse,
} from './purchase-record.res';

export interface PurchaseRecordApi {
  findLatestRecordByGoodId(
    req: FindLatestRecordByGoodIdRequest,
  ): Promise<FindLatestRecordByGoodIdResponse>;
  findManyLatestRecordByGoodId(
    req: FindManyLatestRecordByGoodIdRequest,
  ): Promise<FindManyLatestRecordByGoodIdResponse>;
}

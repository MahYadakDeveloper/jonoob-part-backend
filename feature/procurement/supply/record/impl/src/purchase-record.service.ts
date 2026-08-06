import {
  FindLatestRecordByGoodIdRequest,
  FindLatestRecordByGoodIdResponse,
  FindManyLatestRecordByGoodIdRequest,
  FindManyLatestRecordByGoodIdResponse,
  PurchaseRecordApi,
} from '@feature/procurement-supply-record-api';

export class PurchaseRecordService implements PurchaseRecordApi {
  findLatestRecordByGoodId(
    req: FindLatestRecordByGoodIdRequest,
  ): Promise<FindLatestRecordByGoodIdResponse> {
    throw new Error('Method not implemented.');
  }
  findManyLatestRecordByGoodId(
    req: FindManyLatestRecordByGoodIdRequest,
  ): Promise<FindManyLatestRecordByGoodIdResponse> {
    throw new Error('Method not implemented.');
  }
}

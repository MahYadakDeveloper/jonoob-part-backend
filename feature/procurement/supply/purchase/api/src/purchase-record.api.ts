import {
  CorrectManyRecordRequest,
  CorrectRecordRequest,
  DeleteManyRecordRequest,
  DeleteRecordRequest,
  FindLatestRecordByGoodIdRequest,
  FindManyLatestRecordByGoodIdRequest,
  FindManyRecordByDocumentIdRequest,
  SuppliedRecordManyCreationRequest,
} from './purchase-record.req';
import {
  FindLatestRecordByGoodIdResponse,
  FindManyLatestRecordByGoodIdResponse,
  FindManyRecordByDocumentIdResponse,
} from './purchase-record.res';

export interface PurchaseRecordApi {
  findLatestRecordByGoodId(
    req: FindLatestRecordByGoodIdRequest,
  ): Promise<FindLatestRecordByGoodIdResponse>;
  findManyLatestRecordByGoodId(
    req: FindManyLatestRecordByGoodIdRequest,
  ): Promise<FindManyLatestRecordByGoodIdResponse>;

  createManySuppliedRecord(req: SuppliedRecordManyCreationRequest): Promise<void>;

  findManyRecordByDocumentId(
    req: FindManyRecordByDocumentIdRequest,
  ): Promise<FindManyRecordByDocumentIdResponse>;

  correct(req: CorrectRecordRequest): Promise<void>;
  correctMany(req: CorrectManyRecordRequest): Promise<void>;

  delete(req: DeleteRecordRequest): Promise<void>;
  deleteMany(req: DeleteManyRecordRequest): Promise<void>;
}

import {
  FindGoodByBarcodeRequest,
  FindGoodRequest,
  FindManyGoodRequest,
  GoodCreationRequest,
  GoodDeletionRequest,
  GoodUpdatingRequest,
} from './good.req';
import {
  FindGoodByBarcodeResponse,
  FindGoodResponse,
  FindManyGoodResponse,
  GoodCreationResponse,
} from './good.res';

export interface WarehouseGoodApi {
  find(req: FindGoodRequest): Promise<FindGoodResponse>;
  findMany(req: FindManyGoodRequest): Promise<FindManyGoodResponse>;
  findByBarcode(req: FindGoodByBarcodeRequest): Promise<FindGoodByBarcodeResponse>;

  create(req: GoodCreationRequest): Promise<GoodCreationResponse>;

  update(req: GoodUpdatingRequest): Promise<void>;

  delete(req: GoodDeletionRequest): Promise<void>;
}

import { LineItems } from '@feature/common';
import { NewSuppliedPurchaseRecordDto } from './purchase-record.dto';

export interface FindLatestRecordByGoodIdRequest {
  goodId: string;
}

export interface FindManyLatestRecordByGoodIdRequest {
  goodIds: string[];
}

export interface SuppliedRecordManyCreationRequest {
  lines: LineItems<NewSuppliedPurchaseRecordDto>;
}

export interface SuppliedRecordManyDeletionByDocumentIdRequest {
  documentId: string;
}

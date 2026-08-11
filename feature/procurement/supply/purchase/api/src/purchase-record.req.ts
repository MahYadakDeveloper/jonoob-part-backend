import { LineItems, Money } from '@feature/common';
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

export interface FindManyRecordByDocumentIdRequest {
  documentId: string;
}

export interface CorrectRecordRequest {
  recordId: string;
  purchasePrice: Money;
}

export interface CorrectManyRecordRequest {
  records: LineItems<{
    recordId: string;
    purchasePrice: Money;
  }>;
}

export interface DeleteRecordRequest {
  recordId: string;
}

export interface DeleteManyRecordRequest {
  recordIds: string[];
}

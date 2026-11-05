import { CreatePurchaseRecordData } from './model/purchase-record';

export interface QuotedRecordCreationRequest {
  data: CreatePurchaseRecordData<'quote'>;
}

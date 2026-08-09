import { Page } from '@feature/common';
import { SupplyDocument } from './model/supply-document';

export interface SupplyRecordingResponse {
  documentId: string;
}
export interface SupplyDocumentPageResponse {
  page: Page<SupplyDocument>;
}

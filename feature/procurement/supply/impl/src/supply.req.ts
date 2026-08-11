import { PageCriteria } from '@feature/common';
import { SupplyDocument } from './model/supply-document';

export interface SupplyRecordingRequest {
  document: Omit<SupplyDocument, 'id' | 'suppliedAt' | 'supplier'> & { supplierId: string };
}

export interface SupplyDocumentPageRequest {
  criteria: PageCriteria;
}

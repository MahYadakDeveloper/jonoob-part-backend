import { Barcode } from '@feature/common';
import { DocumentCriteria } from './supply.types';
import { SupplyDocument } from './model/supply-document';

export interface SupplyRecordingRequest {
  document: Omit<SupplyDocument<Barcode>, 'id' | 'suppliedAt'>;
}

export interface SupplyDocumentPageRequest {
  criteria: DocumentCriteria;
}

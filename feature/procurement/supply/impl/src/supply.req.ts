import { SupplyDocument } from './model/supply-document';
import { DocumentCriteria } from './supply.types';

export interface SupplyRecordingRequest {
  document: Omit<SupplyDocument, 'id' | 'suppliedAt'>;
}

export interface SupplyDocumentPageRequest {
  criteria: DocumentCriteria;
}

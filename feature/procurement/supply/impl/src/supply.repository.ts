import { Barcode, Page } from '@feature/common';
import { SupplyDocument } from './model/supply-document';
import { DocumentCriteria } from './supply.types';

export interface SupplyRepository {
  saveDocument(document: Omit<SupplyDocument<string>, 'id' | 'suppliedAt'>): Promise<string>;
  documents(criteria: DocumentCriteria): Promise<Page<SupplyDocument<string>>>;
}

import { Page, PageCriteria } from '@feature/common';
import { SupplyDocument } from './model/supply-document';

export interface SupplyRepository {
  findById(id: string): Promise<SupplyDocument | null>;
  createDocument(document: Omit<SupplyDocument, 'id' | 'suppliedAt'>): Promise<string>;
  updateDocument(document: Omit<SupplyDocument, 'suppliedAt' | 'supplier'>): Promise<void>;
  documents(criteria: PageCriteria): Promise<Page<SupplyDocument>>;

  delete(id: string): Promise<void>;
}

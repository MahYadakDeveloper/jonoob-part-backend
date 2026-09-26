import { PageCriteria, PageResult } from '@feature/common';
import { SupplyReturnDocument, SupplyReturnStatus } from './model/supply-return';

export interface SupplyReturnRepository {
  findById(id: string): Promise<SupplyReturnDocument>;
  documents(criteria: PageCriteria): Promise<PageResult<SupplyReturnDocument>>;

  create(document: Omit<SupplyReturnDocument, 'id' | 'status' | 'createdAt'>): Promise<string>;

  updateStatus(returnId: string, status: SupplyReturnStatus): Promise<void>;
}

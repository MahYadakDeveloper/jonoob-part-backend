import { LineItems } from '@feature/common';
import { ProcurementRequest } from './model/procurement-request';

export interface ProcurementRequestRepository {
  findAll({ take, skip }: { take?: number; skip?: number }): Promise<LineItems<ProcurementRequest>>;

  create(request: ProcurementRequest): Promise<void>;

  /**
   * @param displayName as id
   */
  delete(displayName: string): Promise<void>;
}

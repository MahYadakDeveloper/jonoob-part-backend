import { LineItems, LockableRepository } from '@feature/common';

export type ReserveData = {
  referenceId: string;
  stockId: string;
  qty: number;
};

export interface ReserveRepository extends LockableRepository {
  findByReferenceId(referenceId: string): Promise<LineItems<ReserveData>>;
  upsertMany(reservation: LineItems<ReserveData>): Promise<void>;
  delete(referenceId: string, stockId: string): Promise<void>;
  deleteMany(
    items: LineItems<{ referenceId: string; stockId: string }>,
  ): Promise<void>;
}

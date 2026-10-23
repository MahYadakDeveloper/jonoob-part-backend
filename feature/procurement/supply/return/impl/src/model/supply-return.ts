import { LineItems } from '@feature/shared';

export type SupplyReturnDocument = {
  id: string;
  specialistId: string;
  supplierId: string;
  createdAt: Date;
  updatedAt?: Date;
  status: SupplyReturnStatus;
  items: LineItems<{ goodId: string; quantity: number }>;
};

export type SupplyReturnStatus =
  'pending' | 'returnedToSupplier' | 'damaged' | 'returnedToWarehouse';

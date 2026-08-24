import { LineItems } from '@feature/common';

type ProcessingOrder = {
  orderId: string;
  queuedAt: Date;
};

export interface ProcessingOrderRepository {
  enqueue(orderId: string): Promise<void>;
  remove(orderId: string): Promise<void>;
  listReadyForProcessing(): Promise<LineItems<ProcessingOrder>>;
}

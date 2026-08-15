type ProcessingOrder = {
  orderId: string;
  queuedAt: Date;
};

export interface ProcessingOrderRepository {
  enqueue(orderId: string): Promise<void>;
  remove(orderId: string): Promise<void>;
  getNext(): Promise<ProcessingOrder | null>;
}

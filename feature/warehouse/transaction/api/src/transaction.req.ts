import { LineItems } from '@feature/common';

export type RecordTransactionRequest = {
  type: 'inbound' | 'outbound';
  items: LineItems<{ stockId: string; qty: number }>;
  reference: { source: string; id: string };
};

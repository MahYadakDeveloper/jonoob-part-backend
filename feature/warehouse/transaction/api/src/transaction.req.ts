export type RecordTransactionRequest = {
  type: 'inbound' | 'outbound';
  items: { stockId: string; qty: number }[];
  reference: { source: string; id: string };
};

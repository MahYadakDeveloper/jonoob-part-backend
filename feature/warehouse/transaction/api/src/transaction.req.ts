import { LineItems } from '@feature/common';

type StockItem = { goodId: string; quantity: number };
type TransactionReference = { source: string; id: string };

export type RecordTransactionRequest =
  | {
      type: 'inbound';
      reference: TransactionReference;
      items: LineItems<StockItem>;
    }
  | {
      type: 'outbound';
      reference: TransactionReference;
      items: LineItems<StockItem>;
    };

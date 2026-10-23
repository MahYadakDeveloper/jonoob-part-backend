import { defineEvent } from '@feature/shared/contracts/outbox-event';
import { z } from 'zod';

export const StocksIssuedEvent = defineEvent(
  'warehouse.stocks-issued',
  z.object({
    goodIds: z.array(z.string()),
  }),
);

export const StocksReceiptedEvent = defineEvent(
  'warehouse.stocks-receipted',
  z.object({
    goodIds: z.array(z.string()),
  }),
);

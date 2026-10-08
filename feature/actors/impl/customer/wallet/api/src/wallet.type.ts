import { Money } from '@feature/common';

export type Wallet = {
  id: string;
  total: Money;
  frozen: Money;
};

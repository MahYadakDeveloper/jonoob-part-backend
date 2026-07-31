import { LineItems } from './model/line-items';
import { Money } from './model/money';

export type UnitOfMeasure = 'piece' | 'pair' | 'set';

export type CustomerType = 'merchant' | 'consumer' | 'technician';
export type PricingPolicy = 'wholesale' | 'retail';

export type BankDestination = {
  cardNumber: string;
  firstName: string;
  lastName: string;
};

export type ProductLeafKind = { kind: 'leaf' };
export type ProductBundleKind = { kind: 'bundle' };
export type ProductKind = ProductBundleKind | ProductLeafKind;

export type PaymentMethod = 'posTerminal' | 'onlinePaymentGateway';

export type Payment =
  | {
      kind: 'wallet';
      walletAmount: Money;
    }
  | {
      kind: 'external';
      external: {
        method: PaymentMethod;
        amount: Money;
      };
    }
  | {
      kind: 'mixed';
      walletAmount: Money;
      external: {
        method: PaymentMethod;
        amount: Money;
      };
    };

export type RawProduct = LeafRawProduct | BundleRawProduct;

export type LeafRawProduct = ProductLeafKind & {
  id: string;
  goodId: string;
};

export type BundleRawProduct = ProductBundleKind & {
  id: string;
  items: LineItems<BundleItem>;
};

export type BundleItem = {
  productId: string;
  goodId: string;
  quantity: number;
};

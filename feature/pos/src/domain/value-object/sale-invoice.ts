import { Item } from "domain/value-object/item";
import { CashierId } from "./cashier-id";
import { CustomerId } from "./customer-id";
import { Money } from "./money";

/**
 * NOTE: note that we may need discount service for applying discount only once
 * on item and don't forgot about rewardService to
 */
export class SaleInvoice {
  private constructor(
    private readonly header: {
      readonly cashierId: CashierId;
      readonly issuedAt: Date;
      readonly customerId?: CustomerId;
    },

    private readonly items: Item[],

    private readonly summary: {
      readonly reward?: Money;
      readonly subtotal: Money;
      readonly grandTotal: Money;
      readonly discount?: Money;
    },

    private readonly payment: {
      readonly paidWithWalletBalance: Money;
      readonly amountDue: Money;
    },
  ) {}

  static create(
    header: {
      readonly cashierId: CashierId;
      readonly issuedAt: Date;
      readonly customerId?: CustomerId;
    },

    items: Item[],

    summary: {
      readonly reward?: Money;
      readonly subtotal: Money;
      readonly grandTotal: Money;
      readonly discount?: Money;
    },

    payment: {
      readonly paidWithWalletBalance: Money;
      readonly amountDue: Money;
    },
  ) {
    return new SaleInvoice(header, items, summary, payment);
  }
}

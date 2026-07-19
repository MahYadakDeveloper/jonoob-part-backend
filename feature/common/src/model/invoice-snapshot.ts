import { ProductBundleKind, ProductLeafKind } from "../types";
import { LineItems } from "./line-items";
import { Money } from "./money";

export type InvoiceHeader = {
  readonly cashierId: string;
  readonly issuedAt: Date;
  readonly customerId?: string;
};

export interface AppliedDiscount {
  source: {
    id: string;
    isLimited?: true | false;
  };
  discountPerUnit: Money;
  discountedQuantity: number;
  totalDiscount: Money;
}

export type InvoiceItemBase = {
  readonly productId: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
  readonly discount?: AppliedDiscount;
};

export type ProductInvoiceItem = InvoiceItemBase & ProductLeafKind;

export type BundleInvoiceItem = InvoiceItemBase &
  ProductBundleKind & {
    readonly items: Omit<InvoiceItemBase, "discount">[];
  };

export type InvoiceItem = ProductInvoiceItem | BundleInvoiceItem;

export type InvoicePayment =
  | {
      paidAmountByBalance: Money;
      externalPayment?: {
        paymentMethod: "onlinePaymentGateway" | "posTerminal";
        amount: Money;
      };
    }
  | {
      externalPayment: {
        paymentMethod: "onlinePaymentGateway" | "posTerminal";
        amount: Money;
      };
    };

export type InvoiceSummary = {
  readonly cashback?: Money;
  readonly subtotal: Money;
  readonly grandTotal: Money;
  readonly discount?: Money;
};

export type InvoiceSnapshot = {
  readonly header: InvoiceHeader;
  readonly items: LineItems<InvoiceItem>;
  readonly summary: InvoiceSummary;
  readonly payment: InvoicePayment;
};

import { Money } from "./money";
import { ProductKind } from "../product.type";
import { LineItems } from "./line-items";

export type InvoiceHeader = {
  readonly cashierId: string;
  readonly issuedAt: Date;
  readonly customerId?: string;
};

export type InvoiceItemBase = {
  readonly productId: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
  readonly discount?: Money;
};

export type ProductInvoiceItem = InvoiceItemBase & {
  readonly kind: Extract<ProductKind, "product">;
};

export type BundleInvoiceItem = InvoiceItemBase & {
  readonly kind: Extract<ProductKind, "bundle">;
  readonly items: LineItems<InvoiceItem>;
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

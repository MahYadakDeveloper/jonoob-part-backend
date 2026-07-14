import {
  InvoiceItemBase,
  ProductBundleKind,
  ProductLeafKind,
} from "@feature/common";

export type UnpricedInvoiceItemBase = Omit<
  InvoiceItemBase,
  "unitPrice" | "lineTotal" | "discount"
>;

export type UnpricedProductInvoiceItem = UnpricedInvoiceItemBase &
  ProductLeafKind;

export type UnpricedBundleInvoiceItem = UnpricedInvoiceItemBase &
  ProductBundleKind & {
    readonly items: readonly UnpricedProductInvoiceItem[];
  };

export type UnpricedInvoiceItem =
  | UnpricedProductInvoiceItem
  | UnpricedBundleInvoiceItem;

export type PricingPolicy = "wholesale" | "retail";

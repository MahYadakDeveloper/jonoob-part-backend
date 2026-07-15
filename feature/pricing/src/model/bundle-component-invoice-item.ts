import { ProductInvoiceItem } from "@feature/common";

export type BundleComponentInvoiceItem = Omit<ProductInvoiceItem, "discount">;

export type InvoiceHeader = {
  readonly cashierId: string;
  readonly issuedAt: Date;
  readonly customer?: {
    id: string;
  };
};

export type AppliedDiscount = {
  source: {
    id: string;
    isLimited?: true | false;
  };
  discountPerUnit: number;
  discountedQuantity: number;
  totalDiscount: number;
};

export type GrantedCashback = {
  appliedRate: number;
  amount: number;
};

export type InvoiceItemBase = {
  readonly productId: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
  readonly discount?: AppliedDiscount;
};

export type InvoiceSummary = {
  readonly cashback?: GrantedCashback;
  readonly subtotal: number;
  readonly grandTotal: number;
  readonly discount?: number;
  readonly tax?: number;
};

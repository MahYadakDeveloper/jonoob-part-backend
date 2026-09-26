export interface ReleaseStockRequest {
  quarantines: { id: string; qty: number }[];
}

export interface ReturnToSupplierRequest {
  specialistId: string;
  supplierId: string;
  quarantines: { id: string; qty: number }[];
}

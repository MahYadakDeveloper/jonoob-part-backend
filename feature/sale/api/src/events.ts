export class SaleRecordedEvent {
  constructor(readonly saleId: string) {}
}

export class SaleReturnRecordedEvent {
  constructor(readonly saleReturnId: string) {}
}

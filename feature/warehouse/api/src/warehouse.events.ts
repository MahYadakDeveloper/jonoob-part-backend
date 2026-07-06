export class GoodsIssuedEvent {
  constructor(readonly goodIds: string[]) {}
}

export class GoodsReceiptedEvent {
  constructor(readonly goodIds: string[]) {}
}

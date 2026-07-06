import { Injectable } from "@nestjs/common";

@Injectable()
export class SupplyService {
  constructor() {}

  recordSupply(invoice) {}
  cancelSupply(invoiceId) {}

  recordReturn(invoiceId?, items){}

  findSupplyInvoice(invoiceId){}
}
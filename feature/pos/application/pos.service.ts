import { RecordSaleInputDto } from "./dto/record-sale.dto";

export class PosService {
  /**
   * NOTE: A SALE RECORD
   * {
   *    items: {
   *      productId, qty, baseUnit(count|pair|set), price(Money),discount(Money)
   *      ,withCreditPayedAmount(Money),totalAmount(Money),AmountDue(Money)
   *    }[],
   *    cashierId: string,
   *    customerId: {...},
   *    recordedAt: Date,
   *    . . .
   * }
   */
  async recordSale(inputDto: RecordSaleInputDto) {
    // NOTE: Through this process the SALE RECORD would be made and at final would be registered.
    // Load prices [PricingService]
    // See which has discount [DiscountService]
  }
}

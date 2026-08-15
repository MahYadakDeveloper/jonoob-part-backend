export class OrderService {
  constructor() {}

  /**
   *
   */
  async recordOrder() {
    // dispatch event after successful record
  }

  /**
   *
   */
  async editOrder() {
    //  Dispatch the event because before the state is changed to sending package
    // because the customer can edit and reprocess the package
  }

  /**
   *
   */
  async cancelOrder() {
    // Cancellation only available at processing order period
    // dispatch the event
  }
}

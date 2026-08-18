export class ScheduleService {
  constructor() {}

  async setWeeklySchedule() {
    // [TODO] Rethink about this api
  }

  async setException() {
    // [TODO] Rethink about the naming this api
  }

  /**
   * [TODO]
   * This method return the next schedule business time
   * Example: the friday is holiday and store is closed then the next
   * business hour is saturday 8 AM and for delivery is going to delayed
   * to next business hours
   */
  async getNextBusinessHours() {}
}

import { IsOpenResponse } from './schedule.req';
import { BusinessHours, BusinessHoursException } from './schedule.type';

export interface BusinessCalendarApi {
  getBusinessHours(date: Date): Promise<BusinessHours>;

  isOpen(date: Date): Promise<IsOpenResponse>;
  isOpenNow(): Promise<IsOpenResponse>;
}

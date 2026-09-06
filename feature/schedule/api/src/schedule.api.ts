import { IsOpenResponse } from './schedule.req';
import { Weekday } from './schedule.type';

export interface ScheduleApi {
  isOpenNow(): Promise<IsOpenResponse>;
}

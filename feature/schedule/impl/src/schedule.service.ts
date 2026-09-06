import { type SettingsStore, SettingToken } from '@feature/common';
import { BusinessHoursException, IsOpenResponse, ScheduleApi } from '@feature/schedule-api';
import { Injectable } from '@nestjs/common';
import { businessHoursSchema, BusinessHoursType } from './schedule.schema';
import { isTimeInInterval } from './utils';

@Injectable()
export class ScheduleService implements ScheduleApi {
  private static readonly scheduleSettings: SettingToken<BusinessHoursType> = {
    defaultValue: {
      timezone: 'Asia/Tehran',
      weeklySchedule: [
        {
          weekday: 'saturday',
          open: true,
          intervals: [
            { opensAt: '08:00', closesAt: '13:00' },
            { opensAt: '17:00', closesAt: '21:00' },
          ],
        },
        {
          weekday: 'sunday',
          open: true,
          intervals: [
            { opensAt: '08:00', closesAt: '13:00' },
            { opensAt: '17:00', closesAt: '21:00' },
          ],
        },
        {
          weekday: 'monday',
          open: true,
          intervals: [
            { opensAt: '08:00', closesAt: '13:00' },
            { opensAt: '17:00', closesAt: '21:00' },
          ],
        },
        {
          weekday: 'tuesday',
          open: true,
          intervals: [
            { opensAt: '08:00', closesAt: '13:00' },
            { opensAt: '17:00', closesAt: '21:00' },
          ],
        },
        {
          weekday: 'wednesday',
          open: true,
          intervals: [
            { opensAt: '08:00', closesAt: '13:00' },
            { opensAt: '17:00', closesAt: '21:00' },
          ],
        },
        {
          weekday: 'thursday',
          open: true,
          intervals: [
            { opensAt: '08:00', closesAt: '13:00' },
            { opensAt: '17:00', closesAt: '21:00' },
          ],
        },
        {
          weekday: 'friday',
          open: false,
          intervals: [],
        },
      ],
      exceptions: [],
    },
    key: 'schedule-settings',
    schema: businessHoursSchema,
  };

  constructor(private readonly settings: SettingsStore) {}

  getBusinessHours(): Promise<BusinessHoursType> {
    return this.settings.get(ScheduleService.scheduleSettings);
  }
  setBusinessHours({ data }: { data: BusinessHoursType }): Promise<void> {
    return this.settings.set(ScheduleService.scheduleSettings, data);
  }

  async isOpenNow(): Promise<IsOpenResponse> {
    const businessHours = await this.settings.get(ScheduleService.scheduleSettings);
    const now = new Date();
    const weekdayIndex = now.getDay();
    const weekday = businessHours.weeklySchedule[weekdayIndex];

    // Keep a reference to see if we need to purge expired records later
    let exceptionsChanged = false;
    const activeExceptions: BusinessHoursException[] = [];

    for (const e of businessHours.exceptions) {
      // Standardize comparison to cover the full duration of the end date
      const startTime = new Date(e.date.start).getTime();
      const endTime = new Date(e.date.end).setHours(23, 59, 59, 999);
      const currentTime = now.getTime();

      if (currentTime >= startTime && currentTime <= endTime) {
        return {
          open: false,
          reason: 'exception',
          exception: e,
        };
      }

      // Keep active exceptions, mark expired ones for later removal
      if (currentTime <= endTime) {
        activeExceptions.push(e);
      } else {
        exceptionsChanged = true;
      }
    }

    if (exceptionsChanged) {
      await this.settings.set(ScheduleService.scheduleSettings, {
        ...businessHours,
        exceptions: activeExceptions,
      });
    }

    if (!weekday.open) {
      return {
        open: false,
        reason: 'outside_hours',
      };
    }

    for (const interval of weekday.intervals) {
      // padStart ensures hours and minutes are always two digits (HH:mm)
      const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      if (isTimeInInterval(timeNow, interval.opensAt, interval.closesAt))
        return {
          open: true,
        };
    }

    return {
      open: false,
      reason: 'outside_hours',
    };
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

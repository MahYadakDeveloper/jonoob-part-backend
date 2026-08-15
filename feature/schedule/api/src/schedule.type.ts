export type Weekday =
  | 'saturday'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

export type BusinessHoursInterval = {
  opensAt: string;
  closesAt: string;
};

export type WeeklyBusinessDay = {
  weekday: Weekday;
  enabled: boolean;
  intervals: BusinessHoursInterval[];
};

export type BusinessHoursException =
  | {
      date: Date;
      type: 'closed';
      reason?: string;
    }
  | {
      date: Date;
      type: 'custom';
      intervals: BusinessHoursInterval[];
      reason?: string;
    };

export type BusinessHours = {
  timezone: string;
  weeklySchedule: WeeklyBusinessDay[];
  exceptions: BusinessHoursException[];
};

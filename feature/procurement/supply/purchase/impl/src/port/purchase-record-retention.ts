export interface PurchaseRecordRetentionSettings {
  setDuration(value: Duration): Promise<void>;
  getDuration(): Promise<Duration>;
}

export type Duration = {
  value: number;
  unit: 'month' | 'year';
};

export function toMilliseconds(duration: Duration): number {
  switch (duration.unit) {
    case 'month':
      return duration.value * 2_592_000_000; // 30 days
    case 'year':
      return duration.value * 31_536_000_000; // 365 days
  }
}

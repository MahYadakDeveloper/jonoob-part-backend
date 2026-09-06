/**
 * Helper to convert an "HH:mm" time string into total minutes since midnight.
 */
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Checks if a given time is between an opening and closing time boundary.
 * Inclusive of the starting time, exclusive of the ending time.
 */
export const isTimeInInterval = (timeNow: string, opensAt: string, closesAt: string): boolean => {
  const current = timeToMinutes(timeNow);
  const start = timeToMinutes(opensAt);
  const end = timeToMinutes(closesAt);

  return current >= start && current < end;
};

/**
 * Calculates the "effective date" for the habit tracker.
 * If the current time is before 5:00 AM, it returns the previous day's date.
 */
export const getEffectiveDate = (date: Date = new Date()): Date => {
  const hours = date.getHours();
  if (hours < 5) {
    const yesterday = new Date(date);
    yesterday.setDate(date.getDate() - 1);
    return yesterday;
  }
  return date;
};

/**
 * Returns the effective date string in YYYY-MM-DD format.
 */
export const getEffectiveDateStr = (date: Date = new Date()): string => {
  return getEffectiveDate(date).toISOString().split('T')[0];
};

/**
 * Formats a Date object as YYYY-MM-DD in the local timezone.
 */
export const formatDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates the "effective date" for the habit tracker.
 * If the current time is before 5:00 AM, it returns the previous day's date.
 */
export const getEffectiveDate = (date: Date = new Date()): Date => {
  const hours = date.getHours();
  // We use a clone to avoid mutating the original date
  const result = new Date(date);
  if (hours < 5) {
    result.setDate(result.getDate() - 1);
  }
  return result;
};

/**
 * Returns the effective date string in YYYY-MM-DD format (local time).
 */
export const getEffectiveDateStr = (date: Date = new Date()): string => {
  return formatDateStr(getEffectiveDate(date));
};

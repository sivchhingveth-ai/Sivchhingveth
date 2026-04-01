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

/**
 * Checks if a habit should be visible on a specific day based on monthly target.
 * Monthly target defines how many times per month the habit appears.
 * 
 * @param monthlyTarget - Number of times per month (1, 2, 3, 4, or undefined for daily)
 * @param dateStr - The date to check in YYYY-MM-DD format
 * @returns boolean - Whether the habit should be visible on this day
 */
export const shouldShowHabitOnDay = (monthlyTarget: number | undefined | null, dateStr: string): boolean => {
  // If no target or 0, show every day (full month)
  if (!monthlyTarget || monthlyTarget === 0) {
    return true;
  }
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const currentDay = date.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  switch (monthlyTarget) {
    case 1:
      // Only show on day 1 of the month
      return currentDay === 1;
      
    case 2:
      // Split into 2 periods: first 2 weeks and last 2 weeks
      // Show on day 1 and day 15
      return currentDay === 1 || currentDay === 15;
      
    case 3:
      // Split into 3 periods: every ~10 days
      // Show on day 1, day 11, and day 21
      return currentDay === 1 || currentDay === 11 || currentDay === 21;
      
    case 4:
      // Weekly - show on day 1, 8, 15, 22 (every 7 days)
      return currentDay === 1 || currentDay === 8 || currentDay === 15 || currentDay === 22;
      
    default:
      // For any other number, show every day
      return true;
  }
};

/**
 * Calculates the streak for a habit history.
 * A streak is the number of consecutive days (backwards from today or yesterday)
 * that the habit was completed.
 */
export const calculateStreak = (history: Record<string, boolean>, todayStr: string): number => {
  let streak = 0;
  const [y, m, day] = todayStr.split('-').map(Number);
  const curr = new Date(y, m - 1, day);

  // If done today, start from today
  if (history[todayStr]) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  } else {
    // If NOT done today, start checking from yesterday to keep an existing streak alive
    curr.setDate(curr.getDate() - 1);
  }

  while (history[formatDateStr(curr)]) {
    streak++;
    curr.setDate(curr.getDate() - 1);
    if (streak > 365) break; // sanity cap
  }
  return streak;
};

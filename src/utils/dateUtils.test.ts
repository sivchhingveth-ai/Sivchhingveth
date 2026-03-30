/**
 * @vitest-environment node
 */
import { formatDateStr, getEffectiveDate, getEffectiveDateStr } from './dateUtils';


describe('dateUtils', () => {
  it('should format a date as YYYY-MM-DD', () => {
    const date = new Date(2023, 0, 15); // Jan 15th (m=0)
    expect(formatDateStr(date)).toBe('2023-01-15');
  });

  it('should shift the date to the previous day if time is before 5 AM', () => {
    const Jan16_4AM = new Date(2023, 0, 16, 4, 30);
    const effective = getEffectiveDate(Jan16_4AM);
    expect(effective.getDate()).toBe(15);
    expect(effective.getMonth()).toBe(0);
    expect(formatDateStr(effective)).toBe('2023-01-15');
  });

  it('should NOT shift the date if time is 5 AM or later', () => {
    const Jan16_6AM = new Date(2023, 0, 16, 6, 0);
    const effective = getEffectiveDate(Jan16_6AM);
    expect(effective.getDate()).toBe(16);
    expect(effective.getMonth()).toBe(0);
    expect(formatDateStr(effective)).toBe('2023-01-16');
  });

  it('should format effective date string correctly', () => {
    const Jan16_2AM = new Date(2023, 0, 16, 2, 0);
    expect(getEffectiveDateStr(Jan16_2AM)).toBe('2023-01-15');
    
    const Jan16_8AM = new Date(2023, 0, 16, 8, 0);
    expect(getEffectiveDateStr(Jan16_8AM)).toBe('2023-01-16');
  });
});

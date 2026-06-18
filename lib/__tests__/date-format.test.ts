import { formatDate, formatShortDate, formatShortMonthDay, formatTime, formatWeekdayLong } from '../date-format';

const d = new Date(2024, 0, 15, 14, 30); // Mon Jan 15 2024 14:30

describe('formatDate', () => {
  it('formats long date in Gregorian', () => {
    expect(formatDate(d)).toBe('January 15, 2024');
  });
});

describe('formatShortDate', () => {
  it('formats short date in Gregorian', () => {
    expect(formatShortDate(d)).toBe('Jan 15, 2024');
  });
});

describe('formatShortMonthDay', () => {
  it('formats month and day only in Gregorian', () => {
    expect(formatShortMonthDay(d)).toBe('Jan 15');
  });
});

describe('formatTime', () => {
  it('formats 24-hour time', () => {
    expect(formatTime(d)).toBe('14:30');
  });
});

describe('formatWeekdayLong', () => {
  it('includes weekday and month in Gregorian', () => {
    expect(formatWeekdayLong(d)).toMatch(/Monday/);
    expect(formatWeekdayLong(d)).toMatch(/January/);
  });
});

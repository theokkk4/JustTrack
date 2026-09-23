import { addDays, formatRelativeDay, getGreeting, isSameDay, startOfDay, toDateKey } from '../date';

describe('toDateKey', () => {
  it('uses the local calendar date, not UTC', () => {
    // 11:30pm local on Sep 23 must stay "2026-09-23" regardless of the UTC offset.
    expect(toDateKey(new Date(2026, 8, 23, 23, 30))).toBe('2026-09-23');
  });

  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('startOfDay / addDays / isSameDay', () => {
  it('truncates to local midnight', () => {
    const result = startOfDay(new Date(2026, 8, 23, 15, 45, 12));
    expect([result.getHours(), result.getMinutes(), result.getSeconds()]).toEqual([0, 0, 0]);
    expect(result.getDate()).toBe(23);
  });

  it('rolls across month boundaries', () => {
    expect(toDateKey(addDays(new Date(2026, 8, 30), 1))).toBe('2026-10-01');
  });

  it('compares calendar days, ignoring time', () => {
    expect(isSameDay(new Date(2026, 8, 23, 1), new Date(2026, 8, 23, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 8, 23), new Date(2026, 8, 24))).toBe(false);
  });
});

describe('getGreeting', () => {
  it.each([
    [6, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [2, 'Good evening'],
  ])('at %i:00 says "%s"', (hour, expected) => {
    expect(getGreeting(new Date(2026, 8, 23, hour))).toBe(expected);
  });
});

describe('formatRelativeDay', () => {
  const today = new Date(2026, 8, 23, 9);

  it('labels nearby days relatively', () => {
    expect(formatRelativeDay(new Date(2026, 8, 23, 20), today)).toBe('Today');
    expect(formatRelativeDay(new Date(2026, 8, 22), today)).toBe('Yesterday');
    expect(formatRelativeDay(new Date(2026, 8, 24), today)).toBe('Tomorrow');
  });

  it('falls back to a short date for anything further away', () => {
    expect(formatRelativeDay(new Date(2026, 8, 20), today)).toBe('Sun, Sep 20');
  });
});

import type { LogEntry } from '@/types';
import { describeTimeLeft, isLive, liveEntries, LOG_WINDOW_MS, msUntilNextExpiry } from '../window';

const NOW = Date.parse('2026-10-30T12:00:00Z');

function entry(id: string, loggedAgoMs: number): LogEntry {
  return {
    id,
    loggedAt: new Date(NOW - loggedAgoMs).toISOString(),
    mealType: 'lunch',
    source: 'usda',
    externalFoodId: null,
    externalServingId: null,
    foodName: id,
    brand: null,
    servings: 1,
    amountUnit: 'serving',
    grams: 100,
    isEstimate: false,
    calories: 100,
    protein: 5,
    carbs: 10,
    fat: 2,
  };
}

describe('the 24-hour window', () => {
  it('keeps entries for exactly 24 hours after they were logged', () => {
    expect(isLive(entry('a', 0), NOW)).toBe(true);
    expect(isLive(entry('a', LOG_WINDOW_MS - 1), NOW)).toBe(true);
    expect(isLive(entry('a', LOG_WINDOW_MS), NOW)).toBe(false);
  });

  it('ignores entries from the future or with a broken timestamp', () => {
    expect(isLive(entry('a', -60_000), NOW)).toBe(false);
    expect(isLive({ loggedAt: 'yesterday' }, NOW)).toBe(false);
  });

  it('lists live entries oldest first', () => {
    const entries = [entry('new', 1000), entry('old', 3_600_000), entry('gone', LOG_WINDOW_MS + 1)];
    expect(liveEntries(entries, NOW).map((item) => item.id)).toEqual(['old', 'new']);
  });

  it('knows when the next entry will disappear', () => {
    expect(msUntilNextExpiry([entry('a', 1000), entry('b', 3_600_000)], NOW)).toBe(LOG_WINDOW_MS - 3_600_000);
    expect(msUntilNextExpiry([entry('gone', LOG_WINDOW_MS + 1)], NOW)).toBeNull();
    expect(msUntilNextExpiry([], NOW)).toBeNull();
  });
});

describe('describeTimeLeft', () => {
  it('reads naturally', () => {
    expect(describeTimeLeft(20_000)).toBe('in a moment');
    expect(describeTimeLeft(45 * 60_000)).toBe('in 45m');
    expect(describeTimeLeft(3 * 3_600_000 + 20 * 60_000)).toBe('in 3h 20m');
    expect(describeTimeLeft(2 * 3_600_000)).toBe('in 2h');
  });
});

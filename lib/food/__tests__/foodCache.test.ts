import type { CachedFood } from '@/types';
import {
  cacheFoods,
  clearFoodCache,
  getCachedFood,
  getFoodSnapshot,
  isFresh,
  MAX_FOOD_AGE_MS,
  pruneFoodCache,
  subscribeToFoodCache,
} from '../foodCache';

const NOW = Date.parse('2026-09-25T12:00:00Z');

function food(id: string, fetchedAt: number): CachedFood {
  return {
    id,
    name: `Food ${id}`,
    brand: null,
    type: 'generic',
    servings: [],
    fetchedAt: new Date(fetchedAt).toISOString(),
  };
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  clearFoodCache();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('isFresh', () => {
  it('measures age from when the server fetched the food, with a 23 hour limit', () => {
    expect(isFresh(food('a', NOW - MAX_FOOD_AGE_MS + 1), NOW)).toBe(true);
    expect(isFresh(food('a', NOW - MAX_FOOD_AGE_MS), NOW)).toBe(false);
    expect(isFresh({ ...food('a', NOW), fetchedAt: 'not a date' }, NOW)).toBe(false);
  });
});

describe('cacheFoods / getCachedFood', () => {
  it('stores fresh foods and ignores ones that are already too old', () => {
    cacheFoods([food('fresh', NOW - 60_000), food('stale', NOW - MAX_FOOD_AGE_MS - 1)], NOW);
    expect(getCachedFood('fresh', NOW)?.name).toBe('Food fresh');
    expect(getCachedFood('stale', NOW)).toBeUndefined();
    expect(getFoodSnapshot().has('stale')).toBe(false);
  });

  it('stops serving a food once it turns 23 hours old', () => {
    cacheFoods([food('a', NOW)], NOW);
    expect(getCachedFood('a', NOW + MAX_FOOD_AGE_MS - 1)).toBeDefined();
    expect(getCachedFood('a', NOW + MAX_FOOD_AGE_MS)).toBeUndefined();
  });

  it('notifies subscribers with a new snapshot', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToFoodCache(listener);
    const before = getFoodSnapshot();
    cacheFoods([food('a', NOW)], NOW);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getFoodSnapshot()).not.toBe(before);
    unsubscribe();
  });
});

describe('pruning', () => {
  it('pruneFoodCache drops expired foods and reports how many', () => {
    cacheFoods([food('old', NOW - MAX_FOOD_AGE_MS + 1000), food('new', NOW)], NOW);
    expect(pruneFoodCache(NOW + 2000)).toBe(1);
    expect([...getFoodSnapshot().keys()]).toEqual(['new']);
  });

  it('removes content automatically when it expires, even if nobody reads it', () => {
    cacheFoods([food('a', NOW)], NOW);
    jest.advanceTimersByTime(MAX_FOOD_AGE_MS + 1000);
    expect(getFoodSnapshot().size).toBe(0);
  });

  it('clearFoodCache empties everything', () => {
    cacheFoods([food('a', NOW)], NOW);
    clearFoodCache();
    expect(getFoodSnapshot().size).toBe(0);
  });
});

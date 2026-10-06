import { dateKeyParam, mealTypeParam, singleParam } from '../routeParams';

describe('route params', () => {
  it('takes the first of repeated params', () => {
    expect(singleParam(['a', 'b'])).toBe('a');
    expect(singleParam('a')).toBe('a');
    expect(singleParam(undefined)).toBeUndefined();
  });

  it('accepts only known meal types', () => {
    expect(mealTypeParam('lunch')).toBe('lunch');
    expect(mealTypeParam('brunch')).toBeNull();
    expect(mealTypeParam(undefined)).toBeNull();
  });

  it('accepts only real calendar dates', () => {
    expect(dateKeyParam('2026-09-25')).toBe('2026-09-25');
    expect(dateKeyParam('2026-02-31')).toBeNull();
    expect(dateKeyParam('../etc')).toBeNull();
  });
});

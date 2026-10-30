import { DEFAULT_TINT, heroTintFor } from '../heroTint';

describe('heroTintFor', () => {
  it('picks a tint from the category or name', () => {
    expect(heroTintFor('Fruits', 'Banana, raw')).toEqual(['#FF8F5E', '#FFD1A1']);
    expect(heroTintFor(null, 'Broccoli, cooked')).toEqual(['#4FB37A', '#BDE7C3']);
    expect(heroTintFor('Pizza', 'Pizza, cheese')).toEqual(['#F28A4D', '#FFD0A3']);
  });

  it('falls back to the brand violet', () => {
    expect(heroTintFor('Mystery item')).toEqual(DEFAULT_TINT);
    expect(heroTintFor(undefined, null)).toEqual(DEFAULT_TINT);
  });
});

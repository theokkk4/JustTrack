import { searchUsdaFoods, getUsdaFood, usdaRowToFood } from '../usdaDatabase';
import { rankEntries, scoreEntry, tokenize, toSearchEntry } from '../search';

describe('tokenize', () => {
  it('lowercases, strips accents and punctuation, and folds plurals', () => {
    expect(tokenize('Jalapeños, BERRIES & eggs')).toEqual(['jalapeno', 'berry', 'egg']);
    expect(tokenize('Hummus, glass')).toEqual(['hummus', 'glass']);
  });
});

describe('scoreEntry / rankEntries', () => {
  const names = ['Banana bread', 'Banana, raw', 'Baby Toddler bananas, Stage 1', 'Bread, banana nut'];
  const rank = (query: string) => rankEntries(query, names, (name) => toSearchEntry(name));

  it('puts the plain food first, then foods that are mostly it', () => {
    expect(rank('banana')[0]).toBe('Banana, raw');
    expect(rank('banana').at(-1)).toBe('Baby Toddler bananas, Stage 1');
  });

  it('requires every word to match, prefixes included', () => {
    expect(rank('banana nut')).toEqual(['Bread, banana nut']);
    expect(rank('ban br')).toEqual(['Banana bread', 'Bread, banana nut']);
    expect(scoreEntry(tokenize('pizza'), toSearchEntry('Banana, raw'))).toBeNull();
  });

  it('only surfaces baby food when asked for', () => {
    expect(rank('baby banana')[0]).toBe('Baby Toddler bananas, Stage 1');
  });
});

describe('bundled USDA database', () => {
  const top = (query: string) => searchUsdaFoods(query, 5).map((food) => food.name);

  it('finds everyday foods by their plain names', () => {
    expect(top('banana')[0]).toMatch(/^Bananas?(, raw)?$/);
    expect(top('chicken breast').every((name) => /chicken breast/i.test(name))).toBe(true);
    expect(top('greek yogurt').length).toBeGreaterThan(0);
    expect(top('pizza').some((name) => /pizza/i.test(name))).toBe(true);
  });

  it('turns rows into foods with real portions, defaulting to the first, plus 100 g', () => {
    const food = usdaRowToFood([1, 'Test food', 'Test', 200, 10, 20, 5, [['1 cup', 150], ['1 tbsp', 10]]]);
    expect(food).toMatchObject({ id: 'usda:1', source: 'usda', externalId: '1', name: 'Test food', brand: null });
    expect(food.servings.map((serving) => [serving.id, serving.isDefault, serving.calories])).toEqual([
      ['portion:1 cup', true, 300],
      ['portion:1 tbsp', false, 20],
      ['100g', false, 200],
    ]);
  });

  it('looks foods up by FDC ID', () => {
    const [first] = searchUsdaFoods('banana', 1);
    expect(getUsdaFood(first.externalId)?.name).toBe(first.name);
    expect(getUsdaFood('0')).toBeNull();
  });
});

import { detectChain, getChainFood, matchChainItem, searchChainFoods } from '../chainDatabase';

describe('detectChain', () => {
  it('recognizes chains by full name or nickname and hands back the other words', () => {
    expect(detectChain('chipotle chicken bowl')).toEqual({ chain: 'Chipotle Mexican Grill', rest: ['chicken', 'bowl'] });
    expect(detectChain('cfa spicy sandwich').chain).toBe('Chick-fil-A');
    expect(detectChain("mcdonald's fries").chain).toBe("McDonald's");
    expect(detectChain('taco bell crunchwrap').chain).toBe('Taco Bell');
  });

  it("doesn't mistake a plain word for a chain", () => {
    expect(detectChain('bell pepper').chain).toBeNull();
    expect(detectChain('king crab').chain).toBeNull();
    expect(detectChain('banana').chain).toBeNull();
  });
});

describe('searchChainFoods', () => {
  it('narrows to the named chain', () => {
    const results = searchChainFoods('chipotle chicken burrito');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((food) => food.brand === 'Chipotle Mexican Grill')).toBe(true);
    expect(results[0].name.toLowerCase()).toContain('chicken');
  });

  it('lists a chain’s menu when only the chain is named, and searches every menu otherwise', () => {
    expect(searchChainFoods('chick fil a').every((food) => food.brand === 'Chick-fil-A')).toBe(true);
    const brands = new Set(searchChainFoods('chicken sandwich').map((food) => food.brand));
    expect(brands.size).toBeGreaterThan(1);
  });

  it('builds foods whose one serving carries the menu nutrition', () => {
    const [food] = searchChainFoods("chick-fil-a chicken sandwich");
    expect(food.source).toBe('chain');
    expect(food.servings).toHaveLength(1);
    expect(food.servings[0].calories).toBeGreaterThan(300);
    expect(getChainFood(food.externalId)?.name).toBe(food.name);
  });
});

describe('matchChainItem', () => {
  it('snaps a scanner guess to the chain’s menu item', () => {
    expect(matchChainItem('Chick-fil-A', 'Spicy Chicken Sandwich')?.name.toLowerCase()).toContain('spicy chicken sandwich');
    expect(matchChainItem("McDonald's", 'Big Mac')?.name).toMatch(/big mac/i);
    expect(matchChainItem('Chipotle Mexican Grill', 'chicken burrito bowl')?.brand).toBe('Chipotle Mexican Grill');
  });

  it('respects sizes from the name or the portion', () => {
    expect(matchChainItem('Chick-fil-A', 'Waffle Potato Fries', 'medium')?.name).toMatch(/medium/i);
    expect(matchChainItem('Chick-fil-A', 'Large Waffle Fries')?.name).toMatch(/large/i);
    expect(matchChainItem("McDonald's", 'French Fries', 'small')?.name).toMatch(/small/i);
  });

  it('gives up rather than guess when nothing fits', () => {
    expect(matchChainItem('Chick-fil-A', 'lobster thermidor')).toBeNull();
    expect(matchChainItem('Nowhere Grill', 'fries')).toBeNull();
  });
});

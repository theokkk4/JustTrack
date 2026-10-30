import { chainNames, chainRows } from '@/lib/food/chainDatabase';
import { chainLogo, FEATURED_CHAINS } from '@/lib/food/chainLogos';
import { GROUP_ORDER, groupMenu, menuGroupFor } from '@/lib/food/menuGroups';

describe('menuGroupFor', () => {
  it.each([
    ['Big Mac', 'Burgers'],
    ['Spicy Chicken Sandwich', 'Sandwiches'],
    ['Chicken Burrito Bowl', 'Tacos & Burritos'],
    ['Caesar Salad', 'Bowls & Salads'],
    ['Medium French Fries', 'Sides'],
    ['Grande Caramel Macchiato', 'Drinks'],
    ['Oreo Blizzard', 'Desserts'],
    ['Egg McMuffin', 'Breakfast'],
    ['Happy Meal Hamburger', 'Kids'],
    ['Pepperoni Pizza, Large', 'Pizza'],
    ['Something Unusual', 'Menu'],
  ])('%s → %s', (name, group) => {
    expect(menuGroupFor(name)).toBe(group);
  });
});

describe('groupMenu', () => {
  it('orders sections like a menu board and items A–Z, dropping empty sections', () => {
    const groups = groupMenu(['Vanilla Cone', 'Big Mac', 'Apple Pie', 'Cheeseburger'], (name) => name);
    expect(groups.map((group) => group.title)).toEqual(['Burgers', 'Desserts']);
    expect(groups[0].data).toEqual(['Big Mac', 'Cheeseburger']);
    expect(groups[1].data).toEqual(['Apple Pie', 'Vanilla Cone']);
    expect(GROUP_ORDER).toContain('Menu');
  });
});

describe('featured chains', () => {
  it('every chain in the data is featured, and every featured chain has data or a logo', () => {
    for (const chain of chainNames()) expect(FEATURED_CHAINS).toContain(chain);
    for (const chain of FEATURED_CHAINS) expect(chainRows(chain).length > 0 || chainLogo(chain) !== null).toBe(true);
  });

  it('a menu groups into more than one section for the big chains', () => {
    for (const chain of ["McDonald's", 'Starbucks', 'Taco Bell', 'Chipotle Mexican Grill']) {
      expect(groupMenu(chainRows(chain), (row) => row[2]).length).toBeGreaterThan(2);
    }
  });
});

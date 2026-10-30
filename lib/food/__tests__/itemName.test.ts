import { displayItemName, informativeServing } from '@/lib/food/itemName';

describe('displayItemName', () => {
  it.each([
    ['Chick-fil-A', 'Chick-fil-A Cool Wrap', 'Cool Wrap'],
    ['Chick-fil-A', 'Chick-Fil-A Cool Wrap - Half', 'Cool Wrap - Half'],
    ['Chick-fil-A', 'Chick fil A Deluxe Sandwich w/ American', 'Deluxe Sandwich w/ American'],
    ["McDonald's", "McDonald's Big Mac", 'Big Mac'],
    ["McDonald's", 'Mcdonalds Big Mac', 'Big Mac'],
    ['Starbucks', 'Starbucks: Caramel Macchiato', 'Caramel Macchiato'],
    ['Subway', 'Footlong Oven-Roasted Turkey', 'Footlong Oven-Roasted Turkey'],
    ['Subway', 'Subway', 'Subway'],
    ['Panda Express', 'Panda Express Orange Chicken', 'Orange Chicken'],
    ['Panda Express', 'Panda Bowl', 'Panda Bowl'],
  ])('%s: %s → %s', (chain, name, expected) => {
    expect(displayItemName(chain, name)).toBe(expected);
  });
});

describe('informativeServing', () => {
  it('drops the generic "1 serving" and keeps anything specific', () => {
    expect(informativeServing('1 serving')).toBeNull();
    expect(informativeServing('1 Serving')).toBeNull();
    expect(informativeServing('1 sandwich')).toBe('1 sandwich');
    expect(informativeServing('Medium')).toBe('Medium');
  });
});

import { builderByKey, builderForChain, entryOf, nutritionOf, setCount, toggle, type BuilderConfig } from '../builders';
import { ingredientsOf, shapeOf, subFillings } from '../builders/visual';
import { jerseyMikesSubs } from '../builders/jerseyMikes';
import { getChainFood } from '../chainDatabase';

const step = (config: BuilderConfig, id: string) => config.steps.find((candidate) => candidate.id === id)!;
const option = (config: BuilderConfig, stepId: string, id: string) => step(config, stepId).options.find((candidate) => candidate.id === id)!;

describe('order builders', () => {
  const configs = ['chipotle', 'subway', 'panda', 'jerseymikes'].map((key) => builderByKey(key)!);

  it('exist for the four build-your-own chains and no others', () => {
    expect(configs.map((config) => config.chain)).toEqual(['Chipotle Mexican Grill', 'Subway', 'Panda Express', "Jersey Mike's"]);
    expect(builderForChain('Subway')?.key).toBe('subway');
    expect(builderForChain("McDonald's")).toBeNull();
    expect(builderByKey('nope')).toBeNull();
  });

  it('point every option at a real item on that chain’s menu', () => {
    for (const config of configs) {
      for (const current of config.steps) {
        expect(current.options.length).toBeGreaterThan(0);
        for (const candidate of current.options) {
          for (const item of candidate.items) expect(getChainFood(item.id)?.brand).toBe(config.chain);
        }
      }
      expect(nutritionOf(config, config.defaultSelection).calories).toBeGreaterThan(0);
    }
  });

  it('swaps one-of picks, clears on the second tap, and doubles through setCount', () => {
    const chipotle = builderByKey('chipotle')!;
    let selection = toggle(chipotle.defaultSelection, step(chipotle, 'rice'), option(chipotle, 'rice', 'brown'));
    expect(selection.white).toBeUndefined();
    expect(selection.brown).toBe(1);
    selection = setCount(selection, option(chipotle, 'protein', 'chicken'), 2);
    expect(selection.chicken).toBe(2);
    selection = setCount(selection, option(chipotle, 'protein', 'chicken'), 1);
    expect(selection.chicken).toBe(1);
    selection = toggle(selection, step(chipotle, 'protein'), option(chipotle, 'protein', 'chicken'));
    expect(selection.chicken).toBeUndefined();
    // Not picked: nothing to double. Not doubleable: stays single.
    expect(setCount(selection, option(chipotle, 'protein', 'steak'), 2).steak).toBeUndefined();
    selection = toggle(selection, step(chipotle, 'toppings'), option(chipotle, 'toppings', 'cheese'));
    expect(setCount(selection, option(chipotle, 'toppings', 'cheese'), 2).cheese).toBe(1);
    selection = toggle(selection, step(chipotle, 'toppings'), option(chipotle, 'toppings', 'cheese'));
    expect(selection.cheese).toBeUndefined();
  });

  it('draws the order: shape from the base, ingredients from the picks, beds first', () => {
    const chipotle = builderByKey('chipotle')!;
    const bowl = { ...chipotle.defaultSelection, guac: 1, 'tomato-salsa': 1, chicken: 2 };
    expect(shapeOf(chipotle, bowl)).toBe('bowl');
    expect(shapeOf(chipotle, { ...bowl, bowl: 0, burrito: 1 })).toBe('wrap');
    expect(shapeOf(chipotle, { ...bowl, bowl: 0, 'tacos-soft': 1 })).toBe('tacos');
    const layers = ingredientsOf(chipotle, bowl);
    expect(layers.map((layer) => layer.id)).toEqual(['white', 'chicken', 'guac', 'black', 'tomato-salsa']);
    expect(layers.find((layer) => layer.id === 'chicken')?.count).toBe(2);
    // A named sub is drawn from what the menu puts in it.
    const jersey = builderByKey('jerseymikes')!;
    const blt = jersey.steps[0].options.find((option) => /BLT/.test(option.label))!;
    expect(ingredientsOf(jersey, { [blt.id]: 1, regular: 1 }).map((layer) => layer.label)).toEqual(['bacon', 'tomato', 'lettuce']);
    expect(subFillings('#13 The Original Italian')).toContain('salami');
    const subway = builderByKey('subway')!;
    expect(shapeOf(subway, { ...subway.defaultSelection, wrap: 1, italian: 0 })).toBe('wrap');
    expect(shapeOf(builderByKey('panda')!, {})).toBe('plate');
  });
});

describe('Chipotle', () => {
  const chipotle = builderByKey('chipotle')!;

  it('adds up the menu numbers for the default chicken bowl', () => {
    const expected = ['52051', '71346478', '80096'].reduce((sum, id) => sum + (getChainFood(id)?.servings[0].calories ?? 0), 0);
    expect(nutritionOf(chipotle, chipotle.defaultSelection).calories).toBe(expected);
  });

  it('names the order like a receipt', () => {
    expect(chipotle.nameOf(chipotle.defaultSelection)).toBe('Chicken Bowl');
    expect(chipotle.nameOf({ burrito: 1, steak: 2 })).toBe('Double Steak Burrito');
    expect(chipotle.nameOf({ 'tacos-soft': 1 })).toBe('Veggie Soft Tacos');
    expect(chipotle.describe({ ...chipotle.defaultSelection, cheese: 1, lettuce: 1 })).toBe('white rice, black beans, cheese, romaine lettuce');
    const entry = entryOf(chipotle, { ...chipotle.defaultSelection, guac: 1 }, 'lunch');
    expect(entry).toMatchObject({ source: 'chain', brand: 'Chipotle Mexican Grill', isEstimate: false, foodName: 'Chicken Bowl · white rice, black beans, guacamole' });
  });
});

describe('Subway', () => {
  const subway = builderByKey('subway')!;

  it('doubles everything but the sides for a footlong, and never doubles a wrap', () => {
    const six = nutritionOf(subway, { 'six-inch': 1, italian: 1, turkey: 1, 'cookie-chocolate-chip': 1 });
    const footlong = nutritionOf(subway, { footlong: 1, italian: 1, turkey: 1, 'cookie-chocolate-chip': 1 });
    const cookie = getChainFood('83543369')!.servings[0].calories;
    expect(footlong.calories - cookie).toBeCloseTo((six.calories - cookie) * 2, 5);
    const wrapSix = nutritionOf(subway, { 'six-inch': 1, wrap: 1 });
    const wrapFootlong = nutritionOf(subway, { footlong: 1, wrap: 1 });
    expect(wrapFootlong.calories).toBe(wrapSix.calories);
  });

  it('names it the way the board does', () => {
    expect(subway.nameOf(subway.defaultSelection)).toBe('6-inch Oven-Roasted Turkey on Artisan Italian');
    expect(subway.nameOf({ footlong: 1, multigrain: 1, turkey: 1, bacon: 1 })).toBe('Footlong Oven-Roasted Turkey & Bacon on Hearty Multigrain');
    expect(subway.nameOf({ 'six-inch': 1, 'no-bread': 1, steak: 1 })).toBe('Steak Protein Bowl');
  });
});

describe('Panda Express', () => {
  const panda = builderByKey('panda')!;

  it('counts entrées into a bowl, plate, or bigger plate, and halves a half-and-half side', () => {
    expect(panda.nameOf({ 'chow-mein': 1, orange: 1 })).toBe('Orange Chicken Bowl');
    expect(panda.nameOf({ 'chow-mein': 1, orange: 1, beijing: 1 })).toBe('Orange Chicken & Beijing Beef Plate');
    expect(panda.nameOf({ 'chow-mein': 1, orange: 2, beijing: 1 })).toBe('Double Orange Chicken & Beijing Beef Bigger Plate');
    const chowMein = getChainFood('51920')!.servings[0].calories;
    const friedRice = getChainFood('47577')!.servings[0].calories;
    expect(nutritionOf(panda, { 'half-cm-fr': 1 }).calories).toBeCloseTo((chowMein + friedRice) / 2, 5);
  });
});

describe("Jersey Mike's", () => {
  const mikes = builderByKey('jerseymikes')!;

  it('reads the subs and their sizes out of the menu data', () => {
    const subs = jerseyMikesSubs();
    expect(subs.length).toBeGreaterThan(20);
    expect(subs[0].name).toMatch(/^#1\b/);
    const italian = subs.find((sub) => /Original Italian/.test(sub.name))!;
    expect(Object.keys(italian.sizes)).toEqual(expect.arrayContaining(['Mini', 'Regular', 'Giant']));
    const regular = nutritionOf(mikes, { [italian.id]: 1, regular: 1 }).calories;
    const giant = nutritionOf(mikes, { [italian.id]: 1, giant: 1 }).calories;
    expect(giant).toBeGreaterThan(regular);
    expect(mikes.nameOf({ [italian.id]: 1, giant: 1 })).toBe(`Giant ${italian.name}`);
  });
});

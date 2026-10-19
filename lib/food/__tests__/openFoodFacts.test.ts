import { normalizeOffProduct } from '../openFoodFacts';

describe('normalizeOffProduct', () => {
  it('builds a food with the labeled serving first, then 100 g', () => {
    const food = normalizeOffProduct({
      code: '0894700010137',
      product_name: 'Nonfat Greek Yogurt',
      brands: ['Chobani'],
      nutriments: { 'energy-kcal_100g': 52.9, proteins_100g: 9.41, carbohydrates_100g: 3.53, fat_100g: 0 },
      serving_size: '170 g',
      serving_quantity: 170,
    });
    expect(food).toMatchObject({ id: 'off:0894700010137', source: 'openfoodfacts', externalId: '0894700010137', brand: 'Chobani' });
    expect(food?.servings.map((serving) => [serving.description, serving.isDefault, serving.calories, serving.protein])).toEqual([
      ['1 serving (170 g)', true, 89.9, 16],
      ['100 g', false, 52.9, 9.4],
    ]);
  });

  it('derives calories from kilojoules when kcal is missing', () => {
    const food = normalizeOffProduct({ code: '2000000046692', product_name: 'oreo', nutriments: { 'energy-kj_100g': 1955 } });
    expect(food?.servings[0].calories).toBeCloseTo(467.3, 1);
    expect(food?.servings[0].description).toBe('100 g');
  });

  it('rejects products without a name, a barcode, or believable calories', () => {
    expect(normalizeOffProduct({ code: '123456789', nutriments: { 'energy-kcal_100g': 100 } })).toBeNull();
    expect(normalizeOffProduct({ code: 'abc', product_name: 'X', nutriments: { 'energy-kcal_100g': 100 } })).toBeNull();
    expect(normalizeOffProduct({ code: '123456789', product_name: 'X', nutriments: {} })).toBeNull();
    expect(normalizeOffProduct({ code: '123456789', product_name: 'X', nutriments: { 'energy-kcal_100g': 4000 } })).toBeNull();
  });
});

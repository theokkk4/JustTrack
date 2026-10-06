import { assertEquals } from 'jsr:@std/assert@1';

import { asArray, normalizeFood, normalizeSearch, parseFoodDescription, parseNumber, toGtin13 } from './normalize.ts';

Deno.test('asArray wraps FatSecret’s single-object responses', () => {
  assertEquals(asArray({ a: 1 }), [{ a: 1 }]);
  assertEquals(asArray([1, 2]), [1, 2]);
  assertEquals(asArray(undefined), []);
});

Deno.test('parseNumber handles FatSecret’s numeric strings', () => {
  assertEquals(parseNumber('31.02'), 31.02);
  assertEquals(parseNumber(''), null);
  assertEquals(parseNumber('n/a'), null);
  assertEquals(parseNumber(5), 5);
});

Deno.test('parseFoodDescription reads the search summary line', () => {
  assertEquals(parseFoodDescription('Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g'), {
    basis: '100g',
    calories: 165,
    fat: 3.57,
    carbs: 0,
    protein: 31.02,
  });
  assertEquals(parseFoodDescription('Per 1 cup - Calories: 206kcal | Fat: 0.44g | Carbs: 44.51g | Protein: 4.25g')?.basis, '1 cup');
  assertEquals(parseFoodDescription('something else'), null);
});

Deno.test('normalizeSearch handles a single result returned as an object', () => {
  const page = normalizeSearch({
    foods: {
      food: {
        food_id: '1641',
        food_name: 'Chicken Breast',
        food_type: 'Generic',
        food_description: 'Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g',
      },
      max_results: '25',
      page_number: '0',
      total_results: '1',
    },
  });
  assertEquals(page.totalResults, 1);
  assertEquals(page.results, [
    { id: '1641', name: 'Chicken Breast', brand: null, type: 'generic', basis: '100g', calories: 165, protein: 31.02, carbs: 0, fat: 3.57 },
  ]);
});

Deno.test('normalizeSearch tolerates an empty response', () => {
  assertEquals(normalizeSearch({ foods: { max_results: '25', page_number: '0', total_results: '0' } }).results, []);
});

Deno.test('normalizeFood converts servings, ounces, and picks a default', () => {
  const food = normalizeFood({
    food_id: '99',
    food_name: 'Granola Bar',
    brand_name: 'Nature Valley',
    food_type: 'Brand',
    servings: {
      serving: [
        {
          serving_id: '1',
          serving_description: '1 bar',
          metric_serving_amount: '1.500',
          metric_serving_unit: 'oz',
          calories: '190',
          protein: '3',
          carbohydrate: '29',
          fat: '7',
        },
        { serving_id: '2', serving_description: '1 serving', calories: '190', protein: '3', carbohydrate: '29', fat: '7' },
      ],
    },
  });
  assertEquals(food?.brand, 'Nature Valley');
  assertEquals(food?.type, 'brand');
  assertEquals(food?.servings.length, 2);
  assertEquals(Math.round((food?.servings[0].metricAmount ?? 0) * 100) / 100, 42.52);
  assertEquals(food?.servings[0].metricUnit, 'g');
  assertEquals(food?.servings[0].isDefault, true);
  assertEquals(food?.servings[1].metricAmount, null);
});

Deno.test('normalizeFood keeps FatSecret’s own default serving when flagged', () => {
  const food = normalizeFood({
    food_id: '1',
    food_name: 'Rice',
    servings: {
      serving: [
        { serving_id: 'a', serving_description: '100 g', metric_serving_amount: '100', metric_serving_unit: 'g', calories: '130', is_default: '0' },
        { serving_id: 'b', serving_description: '1 cup', metric_serving_amount: '158', metric_serving_unit: 'g', calories: '206', is_default: '1' },
      ],
    },
  });
  assertEquals(food?.servings.map((serving) => serving.isDefault), [false, true]);
});

Deno.test('normalizeFood rejects foods without usable servings', () => {
  assertEquals(normalizeFood({ food_id: '1', food_name: 'Mystery', servings: {} }), null);
  assertEquals(normalizeFood(null), null);
});

Deno.test('toGtin13 normalizes common barcode formats', () => {
  assertEquals(toGtin13('012345678905'), '0012345678905');
  assertEquals(toGtin13('5901234123457'), '5901234123457');
  assertEquals(toGtin13('96385074'), '0000096385074');
  assertEquals(toGtin13('00012345678905'), '0012345678905');
  assertEquals(toGtin13('12345'), null);
});

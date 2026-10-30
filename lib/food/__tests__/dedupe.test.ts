import type { FoodDetail } from '@/types';
import { dedupeFoods, duplicateKey, sortByCompleteness } from '../dedupe';

function food(id: string, name: string, brand: string | null, kcal: number, extras: Partial<FoodDetail> = {}): FoodDetail {
  return {
    id: `off:${id}`,
    source: 'openfoodfacts',
    externalId: id,
    name,
    brand,
    servings: [{ id: '100g', description: '100 g', metricAmount: 100, metricUnit: 'g', isDefault: true, calories: kcal, protein: 9, carbs: 4, fat: 0 }],
    ...extras,
  };
}

describe('dedupeFoods', () => {
  it('collapses the same product listed under several barcodes, keeping the one with a photo', () => {
    const bare = food('1', 'Nonfat Greek Yogurt', 'Chobani', 53);
    const withPhoto = food('2', 'Nonfat greek yogurt', 'chobani', 54, { imageUrl: 'https://images.openfoodfacts.org/2.jpg' });
    const other = food('3', 'Nonfat Greek Yogurt', 'Chobani', 120);
    expect(dedupeFoods([bare, withPhoto, other]).map((item) => item.id)).toEqual(['off:2', 'off:3']);
  });

  it('ignores accents, punctuation, and rounding noise in the key', () => {
    expect(duplicateKey(food('1', 'Crème fraîche!', 'Président', 291))).toBe(duplicateKey(food('2', 'creme fraiche', 'president', 292)));
    expect(duplicateKey(food('1', 'Milk', 'A', 60))).not.toBe(duplicateKey(food('2', 'Milk', 'B', 60)));
  });

  it('keeps first-seen order for distinct foods', () => {
    const items = [food('1', 'A', null, 10), food('2', 'B', null, 20), food('3', 'A', null, 10)];
    expect(dedupeFoods(items).map((item) => item.id)).toEqual(['off:1', 'off:2']);
  });
});

describe('sortByCompleteness', () => {
  it('moves results with a photo or serving ahead of bare ones without reordering equals', () => {
    const items = [food('1', 'Chobani', 'Chobani', 60), food('2', 'Greek Yogurt', 'Chobani', 60, { imageUrl: 'https://x/2.jpg' }), food('3', 'Chobani', 'Chobani', 70)];
    expect(sortByCompleteness(items).map((item) => item.id)).toEqual(['off:2', 'off:1', 'off:3']);
  });
});

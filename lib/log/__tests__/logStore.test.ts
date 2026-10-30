import { parseEntry } from '../logStore';

const valid = {
  id: 'a',
  loggedAt: '2026-10-30T12:00:00Z',
  mealType: 'lunch',
  source: 'usda',
  externalFoodId: '1',
  externalServingId: '100g',
  foodName: 'Rice',
  brand: null,
  servings: 1.5,
  amountUnit: 'g',
  grams: 150,
  isEstimate: false,
  imageUri: 'https://images.openfoodfacts.org/rice.jpg',
  calories: 195,
  protein: 4,
  carbs: 42,
  fat: 0.5,
};

describe('parseEntry', () => {
  it('accepts a well-formed saved entry', () => {
    expect(parseEntry(valid)).toEqual(valid);
  });

  it('rejects anything missing a required field or with a bad value', () => {
    expect(parseEntry({ ...valid, mealType: 'brunch' })).toBeNull();
    expect(parseEntry({ ...valid, calories: 'lots' })).toBeNull();
    expect(parseEntry({ ...valid, source: 'fatsecret' })).toBeNull();
    expect(parseEntry(null)).toBeNull();
    expect(parseEntry('x')).toBeNull();
  });

  it('fills optional fields in safely', () => {
    const { brand: _brand, externalFoodId: _id, isEstimate: _estimate, imageUri: _image, ...partial } = valid;
    expect(parseEntry(partial)).toMatchObject({ brand: null, externalFoodId: null, isEstimate: false, imageUri: null });
  });

  it('keeps only safe pictures: https product photos and small inline thumbnails', () => {
    expect(parseEntry({ ...valid, imageUri: 'data:image/jpeg;base64,/9j/4AAQ' })?.imageUri).toBe('data:image/jpeg;base64,/9j/4AAQ');
    expect(parseEntry({ ...valid, imageUri: 'javascript:alert(1)' })?.imageUri).toBeNull();
    expect(parseEntry({ ...valid, imageUri: `data:image/jpeg;base64,${'A'.repeat(130_000)}` })?.imageUri).toBeNull();
  });
});

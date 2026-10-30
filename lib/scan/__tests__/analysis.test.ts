import { parseMealAnalysis } from '../analysis';
import { matchRowToFood, removeRow, resetReview, reviewStore, rowFromEstimate, rowNutrition, setRowGrams, startAnalysis, finishAnalysis } from '../reviewStore';

describe('parseMealAnalysis', () => {
  it('keeps well-formed foods and drops junk', () => {
    const analysis = parseMealAnalysis({
      foods: [
        { name: 'Grilled chicken breast', portionDescription: 'one breast', estimatedGrams: 150, confidence: 0.9, calories: 248, protein: 46, carbs: 0, fat: 5 },
        { name: '', estimatedGrams: 10, calories: 10 },
        { name: 'Ghost', estimatedGrams: -5, calories: 10 },
        { name: 'Rice', estimatedGrams: 160, calories: 206 },
      ],
      note: '  Part of the plate is out of frame. ',
    });
    expect(analysis?.foods.map((food) => food.name)).toEqual(['Grilled chicken breast', 'Rice']);
    expect(analysis?.foods[1]).toMatchObject({ portionDescription: '160 g', confidence: 0.5, protein: 0 });
    expect(analysis?.note).toBe('Part of the plate is out of frame.');
  });

  it('rejects responses without a foods list', () => {
    expect(parseMealAnalysis({ note: 'x' })).toBeNull();
    expect(parseMealAnalysis(null)).toBeNull();
  });
});

describe('reviewStore', () => {
  beforeEach(resetReview);

  it('scales a row’s nutrition with its grams', () => {
    const row = rowFromEstimate({ name: 'Rice', portionDescription: '1 cup', estimatedGrams: 160, confidence: 0.7, calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 });
    expect(rowNutrition({ ...row, grams: 80 })).toEqual({ calories: 103, protein: 2.2, carbs: 22.3, fat: 0.2 });
  });

  it('walks a scan from analyzing to ready and edits rows', () => {
    startAnalysis('blob:photo');
    expect(reviewStore.getSnapshot()).toMatchObject({ status: 'analyzing', photoUri: 'blob:photo', rows: [] });
    finishAnalysis({ foods: [{ name: 'Rice', portionDescription: '1 cup', estimatedGrams: 160, confidence: 0.7, calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 }], note: null });
    const [row] = reviewStore.getSnapshot().rows;
    setRowGrams(row.id, 80);
    expect(reviewStore.getSnapshot().rows[0].grams).toBe(80);

    matchRowToFood(row.id, {
      id: 'usda:1',
      source: 'usda',
      externalId: '1',
      name: 'Rice, white, cooked',
      brand: null,
      servings: [{ id: '100g', description: '100 g', metricAmount: 100, metricUnit: 'g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, isDefault: true }],
    });
    const matched = reviewStore.getSnapshot().rows[0];
    expect(matched.name).toBe('Rice, white, cooked');
    expect(matched.grams).toBe(80);
    expect(rowNutrition(matched).calories).toBe(104);

    removeRow(row.id);
    expect(reviewStore.getSnapshot().rows).toEqual([]);
  });
});

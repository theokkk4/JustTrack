#!/usr/bin/env node
/**
 * Builds assets/data/usda-foods.json — the food database bundled in the app —
 * from USDA FoodData Central's "Survey (FNDDS)" download (public domain).
 *
 *   1. Download the JSON release, e.g.
 *      https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_json_2024-10-31.zip
 *   2. Unzip it, then run:
 *      node scripts/build-food-database.js path/to/surveyDownload.json
 *
 * Output rows: [fdcId, name, category, kcal, protein, carbs, fat, portions]
 * with nutrition per 100 g and portions as [description, grams].
 */
const fs = require('fs');
const path = require('path');

const NUTRIENTS = { kcal: '208', protein: '203', carbs: '205', fat: '204' };
const round1 = (value) => Math.round(value * 10) / 10;

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/build-food-database.js path/to/surveyDownload.json');
  process.exit(1);
}

const { SurveyFoods: foods } = JSON.parse(fs.readFileSync(input, 'utf8'));
const rows = [];

for (const food of foods) {
  const amounts = {};
  for (const entry of food.foodNutrients ?? []) {
    const number = entry.nutrient?.number;
    for (const [key, wanted] of Object.entries(NUTRIENTS)) {
      if (number === wanted && typeof entry.amount === 'number') amounts[key] = entry.amount;
    }
  }
  if (amounts.kcal === undefined) continue;

  const portions = (food.foodPortions ?? [])
    .filter((portion) => portion.gramWeight > 0 && portion.portionDescription && !/quantity not specified/i.test(portion.portionDescription))
    .sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))
    .map((portion) => [portion.portionDescription.trim(), round1(portion.gramWeight)]);

  rows.push([
    food.fdcId,
    food.description.trim(),
    food.wweiaFoodCategory?.wweiaFoodCategoryDescription ?? '',
    round1(amounts.kcal),
    round1(amounts.protein ?? 0),
    round1(amounts.carbs ?? 0),
    round1(amounts.fat ?? 0),
    portions,
  ]);
}

rows.sort((a, b) => a[1].localeCompare(b[1]));
const output = {
  source: 'USDA FoodData Central, Survey (FNDDS) — public domain',
  release: foods[0]?.publicationDate ?? null,
  foods: rows,
};
const target = path.join(__dirname, '..', 'assets', 'data', 'usda-foods.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(output));
console.log(`Wrote ${rows.length} foods to ${path.relative(process.cwd(), target)} (${(fs.statSync(target).size / 1024).toFixed(0)} KB)`);

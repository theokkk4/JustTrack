export type UUID = string;
export type ISODateString = string;

export type ThemePreference = 'light' | 'dark' | 'system';
export type WeightUnit = 'lb' | 'kg';
export type HeightUnit = 'ft_in' | 'cm';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type WeightGoal = 'lose' | 'maintain' | 'gain';
/** Only used for the BMR estimate; "unspecified" is always an option. */
export type Sex = 'male' | 'female' | 'unspecified';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
/** usda: the bundled USDA database · openfoodfacts: packaged foods · custom: the user's own · ai_estimate: the photo scanner. */
export type FoodSource = 'usda' | 'openfoodfacts' | 'custom' | 'ai_estimate';
/** How an amount was entered: a count of servings, or a metric weight/volume. */
export type AmountUnit = 'serving' | 'g' | 'ml';
export type MetricUnit = 'g' | 'ml';

export interface Profile {
  id: UUID;
  displayName: string | null;
  avatarUrl: string | null;
  sex: Sex | null;
  birthYear: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  weightGoal: WeightGoal | null;
  onboardingCompletedAt: ISODateString | null;
  createdAt: ISODateString;
}

export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A user's daily targets: calories in kcal, macros in grams. */
export interface NutritionGoals extends NutritionValues {
  id: UUID;
  userId: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Foods
// ---------------------------------------------------------------------------

/** One way to measure a food, with the nutrition for exactly one of it. */
export interface FoodServing extends NutritionValues {
  id: string;
  /** e.g. "1 cup (248 g)", "100 g", "1 serving (30 g)". */
  description: string;
  /** Grams (or ml) in one serving, when known. */
  metricAmount: number | null;
  metricUnit: MetricUnit | null;
  isDefault: boolean;
}

/** A food from the bundled USDA database or Open Food Facts, ready to log. */
export interface FoodDetail {
  /** "usda:2705483" or "off:0894700010137". */
  id: string;
  source: 'usda' | 'openfoodfacts';
  /** The USDA FDC ID or the product barcode. */
  externalId: string;
  name: string;
  brand: string | null;
  servings: FoodServing[];
}

// ---------------------------------------------------------------------------
// Diary
// ---------------------------------------------------------------------------

export interface Meal {
  id: UUID;
  userId: UUID;
  name: string | null;
  mealType: MealType;
  eatenAt: ISODateString;
  createdAt: ISODateString;
}

/** A diary row as stored. Every row keeps its own name and nutrition, so the diary works offline. */
export interface MealItemRecord {
  id: UUID;
  mealId: UUID;
  source: FoodSource;
  externalFoodId: string | null;
  externalServingId: string | null;
  /** Servings eaten. Gram entries are stored as a fraction of a metric serving (e.g. 1.5 × 100 g). */
  servings: number;
  amountUnit: AmountUnit;
  /** Came from the AI photo scanner, so the UI labels it "Estimated". */
  isEstimate: boolean;
  foodName: string;
  brand: string | null;
  grams: number;
  /** Totals for the logged amount. */
  nutrition: NutritionValues;
  createdAt: ISODateString;
}

export interface MealRecord extends Meal {
  items: MealItemRecord[];
}

/** A diary row ready to show. */
export interface MealItem extends NutritionValues {
  id: UUID;
  mealId: UUID;
  mealType: MealType;
  eatenAt: ISODateString;
  source: FoodSource;
  foodName: string;
  brand: string | null;
  /** e.g. "1.5 × 1 cup" or "150 g". */
  amountLabel: string;
  isEstimate: boolean;
  record: MealItemRecord;
  createdAt: ISODateString;
}

export interface MealWithItems extends Meal {
  items: MealItem[];
}

/** A new diary row: what was eaten, how much, and its nutrition for that amount. */
export interface NewMealItem {
  source: FoodSource;
  /** USDA FDC ID or barcode, when the food came from a database. */
  externalFoodId?: string | null;
  /** Which of the food's servings the amount was measured in, so editing can reopen it. */
  externalServingId?: string | null;
  foodName: string;
  brand?: string | null;
  servings: number;
  amountUnit: AmountUnit;
  grams: number;
  nutrition: NutritionValues;
  isEstimate?: boolean;
}

export interface CustomFood extends NutritionValues {
  id: UUID;
  userId: UUID;
  name: string;
  brand: string | null;
  servingSize: number;
  barcode: string | null;
  createdAt: ISODateString;
}

export interface SavedMeal {
  id: UUID;
  userId: UUID;
  name: string;
  createdAt: ISODateString;
}

/** A food's nutrition anchored to the gram weight it was measured for (100g, or one serving's grams). */
export interface NutritionBasis extends NutritionValues {
  referenceGrams: number;
}

export interface AIFoodCandidate {
  name: string;
  estimatedGrams: number;
  confidence: number;
}

export interface AIMealAnalysis {
  foods: AIFoodCandidate[];
}

/** An AI-identified or scanned food item as the user reviews/edits it before logging. */
export interface ReviewedFoodItem extends NutritionBasis {
  localId: string;
  name: string;
  grams: number;
  confidence?: number;
  source: FoodSource;
  externalFoodId?: string | null;
}

export interface DailyTotals extends NutritionValues {
  date: ISODateString;
}

export interface WeightEntry {
  id: UUID;
  userId: UUID;
  weightKg: number;
  recordedAt: ISODateString;
}

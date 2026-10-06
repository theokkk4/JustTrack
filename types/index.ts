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
export type FoodSource = 'fatsecret' | 'openfoodfacts' | 'custom' | 'ai_estimate';
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
// Foods (shapes returned by the fatsecret-* Edge Functions)
// ---------------------------------------------------------------------------

/** One way to measure a food, with the nutrition for exactly one of it. */
export interface FoodServing extends NutritionValues {
  id: string;
  /** e.g. "1 cup", "100 g", "1 bar". */
  description: string;
  /** Grams (or ml) in one serving, when known. */
  metricAmount: number | null;
  metricUnit: MetricUnit | null;
  isDefault: boolean;
}

export interface FoodDetail {
  id: string;
  name: string;
  brand: string | null;
  type: 'generic' | 'brand';
  servings: FoodServing[];
}

/** FatSecret content plus when it was obtained. Their terms: never kept for 24 hours or more. */
export interface CachedFood extends FoodDetail {
  fetchedAt: ISODateString;
}

export interface FoodSearchResult {
  id: string;
  name: string;
  brand: string | null;
  type: 'generic' | 'brand';
  /** What the headline numbers are measured per, e.g. "100g" or "1 cup". */
  basis: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface FoodSearchPage {
  results: FoodSearchResult[];
  totalResults: number;
  pageNumber: number;
  maxResults: number;
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

/**
 * A diary row as stored. FatSecret's terms only allow keeping IDs, so for
 * source "fatsecret" the name and nutrition are null here and are resolved
 * from the food database when shown; every other source stores its own.
 */
export interface MealItemRecord {
  id: UUID;
  mealId: UUID;
  source: FoodSource;
  externalFoodId: string | null;
  externalServingId: string | null;
  /** Servings eaten. Gram entries are stored as a fraction of a metric serving. */
  servings: number;
  amountUnit: AmountUnit;
  /** Came from the AI photo scanner, so the UI labels it "Estimated". */
  isEstimate: boolean;
  foodName: string | null;
  brand: string | null;
  grams: number | null;
  /** Totals for the logged amount; null for FatSecret rows. */
  nutrition: NutritionValues | null;
  createdAt: ISODateString;
}

export interface MealRecord extends Meal {
  items: MealItemRecord[];
}

/** A diary row ready to show: content resolved and nutrition calculated for the logged amount. */
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
  /**
   * False when a FatSecret food couldn't be loaded (offline, or since removed
   * from their database). Its nutrition counts as 0 and the UI says so.
   */
  resolved: boolean;
  record: MealItemRecord;
  createdAt: ISODateString;
}

export interface MealWithItems extends Meal {
  items: MealItem[];
}

/** A new diary row. FatSecret rows carry only IDs and the amount; others carry their content. */
export type NewMealItem =
  | {
      source: 'fatsecret';
      externalFoodId: string;
      externalServingId: string;
      servings: number;
      amountUnit: AmountUnit;
      isEstimate?: boolean;
    }
  | {
      source: Exclude<FoodSource, 'fatsecret'>;
      externalFoodId?: string | null;
      foodName: string;
      brand?: string | null;
      servings: number;
      amountUnit: AmountUnit;
      grams: number;
      nutrition: NutritionValues;
      isEstimate?: boolean;
    };

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

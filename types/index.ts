export type UUID = string;
export type ISODateString = string;

export type ThemePreference = 'light' | 'dark' | 'system';
export type WeightUnit = 'lb' | 'kg';
export type HeightUnit = 'ft_in' | 'cm';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type WeightGoal = 'lose' | 'maintain' | 'gain';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export type FoodSource = 'fatsecret' | 'custom' | 'ai_estimate';

export interface Profile {
  id: UUID;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: ISODateString;
}

export interface NutritionGoals {
  id: UUID;
  userId: UUID;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: UUID;
  userId: UUID;
  name: string | null;
  mealType: MealType;
  eatenAt: ISODateString;
  createdAt: ISODateString;
}

export interface MealItem extends NutritionValues {
  id: UUID;
  mealId: UUID;
  foodName: string;
  brand: string | null;
  externalFoodId: string | null;
  source: FoodSource;
  servings: number;
  grams: number;
  createdAt: ISODateString;
}

export interface MealWithItems extends Meal {
  items: MealItem[];
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

export interface FoodSearchResult {
  id: string;
  name: string;
  brand: string | null;
  description: string;
  source: Extract<FoodSource, 'fatsecret' | 'custom'>;
}

export interface FoodServingOption extends NutritionBasis {
  id: string;
  description: string;
  isDefault?: boolean;
}

export interface FoodDetail {
  id: string;
  name: string;
  brand: string | null;
  source: Extract<FoodSource, 'fatsecret' | 'custom'>;
  barcode?: string | null;
  servings: FoodServingOption[];
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

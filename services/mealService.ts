import { mapMealRow, portionUpdate, recordToNewItem, toMealItemPayload } from '@/lib/diary/records';
import type { StoredPortion } from '@/lib/nutrition/portion';
import { supabase } from '@/lib/supabase/client';
import type { FoodDetail, MealItemRecord, MealRecord, MealType, NewMealItem } from '@/types';

/** Meals (with items) eaten in [start, end), oldest first. RLS limits this to the signed-in user anyway. */
export async function fetchMeals(userId: string, start: Date, end: Date): Promise<MealRecord[]> {
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('user_id', userId)
    .gte('eaten_at', start.toISOString())
    .lt('eaten_at', end.toISOString())
    .order('eaten_at', { ascending: true });
  if (error) throw error;
  return data.map(mapMealRow).filter((meal): meal is MealRecord => meal !== null);
}

/** Logs a meal and its items in one transaction (see the log_meal migration). Returns the meal's ID. */
export async function logMeal(input: { mealType: MealType; eatenAt: Date; items: NewMealItem[]; name?: string }): Promise<string> {
  const { data, error } = await supabase.rpc('log_meal', {
    p_meal_type: input.mealType,
    p_eaten_at: input.eatenAt.toISOString(),
    p_items: input.items.map(toMealItemPayload),
    p_name: input.name,
  });
  if (error) throw error;
  return data;
}

export async function updateMealItemPortion(record: MealItemRecord, food: FoodDetail, portion: StoredPortion): Promise<void> {
  const changes = portionUpdate(record, food, portion);
  if (!changes) throw new Error('That amount doesn’t work for this food.');
  const { error } = await supabase.from('meal_items').update(changes).eq('id', record.id);
  if (error) throw error;
}

/** Moves an entry to another meal on the same day (see the move_meal_item migration). */
export async function moveMealItem(itemId: string, mealType: MealType): Promise<void> {
  const { error } = await supabase.rpc('move_meal_item', { p_item_id: itemId, p_meal_type: mealType });
  if (error) throw error;
}

export async function duplicateMealItem(record: MealItemRecord, mealType: MealType, eatenAt: Date): Promise<void> {
  const item = recordToNewItem(record);
  if (!item) throw new Error('This entry can’t be duplicated.');
  await logMeal({ mealType, eatenAt, items: [item] });
}

/** Deleting a meal's last item deletes the meal too (database trigger). */
export async function deleteMealItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('meal_items').delete().eq('id', itemId);
  if (error) throw error;
}

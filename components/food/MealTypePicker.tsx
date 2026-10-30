import React from 'react';

import { PillTabs } from '@/components/ui/PillTabs';
import { MEAL_TYPE_META, MEAL_TYPES } from '@/constants/nutrition';
import type { MealType } from '@/types';

const OPTIONS = MEAL_TYPES.map((value) => ({ value, label: MEAL_TYPE_META[value].label }));

export function MealTypePicker({ value, onChange }: { value: MealType; onChange: (value: MealType) => void }) {
  return <PillTabs options={OPTIONS} value={value} onChange={onChange} accessibilityLabel="Meal" />;
}

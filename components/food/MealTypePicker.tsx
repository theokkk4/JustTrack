import React from 'react';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MEAL_TYPE_META, MEAL_TYPES } from '@/constants/nutrition';
import type { MealType } from '@/types';

const OPTIONS = MEAL_TYPES.map((value) => ({ value, label: MEAL_TYPE_META[value].label }));

export function MealTypePicker({ value, onChange }: { value: MealType; onChange: (value: MealType) => void }) {
  return <SegmentedControl options={OPTIONS} value={value} onChange={onChange} accessibilityLabel="Meal" />;
}

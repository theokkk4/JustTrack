import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { FatSecretAttribution } from '@/components/food/FatSecretAttribution';
import { MealTypePicker } from '@/components/food/MealTypePicker';
import { NutritionSummary } from '@/components/food/NutritionSummary';
import { PortionEditor } from '@/components/food/PortionEditor';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Spacing } from '@/constants/theme';
import { useDiary } from '@/contexts/DiaryContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useFood } from '@/hooks/useFood';
import { usePortion } from '@/hooks/usePortion';
import type { MealType } from '@/types';
import { formatRelativeDay, parseDateKey, toDateKey } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';
import { defaultMealType } from '@/utils/mealTime';
import { dateKeyParam, mealTypeParam, singleParam } from '@/utils/routeParams';

const NO_NUTRITION = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export default function AddFoodScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ id: string; mealType?: string; date?: string }>();
  const { now, today } = useCurrentTime();
  const { logFood } = useDiary();

  const foodId = singleParam(params.id);
  const dateKey = dateKeyParam(params.date) ?? toDateKey(today);
  const [mealType, setMealType] = useState<MealType>(() => mealTypeParam(params.mealType) ?? defaultMealType(now));
  const { food, error: loadError, retry } = useFood(foodId);
  const portion = usePortion(food);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const add = async () => {
    if (!food || !portion.stored) return;
    setSaving(true);
    setSaveError(null);
    try {
      await logFood({
        dateKey,
        mealType,
        item: {
          source: 'fatsecret',
          externalFoodId: food.id,
          externalServingId: portion.stored.servingId,
          servings: portion.stored.servings,
          amountUnit: portion.stored.amountUnit,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Close the whole Add Food modal, not just this screen.
      navigation.getParent()?.goBack();
    } catch (caught) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSaveError(getErrorMessage(caught));
      setSaving(false);
    }
  };

  if (!food) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {loadError ? (
          <EmptyState icon="wifiOff" title="Couldn’t load this food" message={loadError} actionLabel="Try Again" onAction={retry} />
        ) : (
          <ActivityIndicator color={colors.textSecondary} />
        )}
      </View>
    );
  }

  const day = formatRelativeDay(parseDateKey(dateKey) ?? today, today);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.heading}>
        <ThemedText variant="title1" accessibilityRole="header">
          {food.name}
        </ThemedText>
        {food.brand ? (
          <ThemedText variant="subhead" color="secondary">
            {food.brand}
          </ThemedText>
        ) : null}
      </View>

      <NutritionSummary nutrition={portion.nutrition ?? NO_NUTRITION} caption={portion.description ?? undefined} />

      <PortionEditor portion={portion} />

      <View style={styles.meal}>
        <ThemedText variant="footnote" color="secondary" style={styles.label}>
          MEAL · {day.toUpperCase()}
        </ThemedText>
        <MealTypePicker value={mealType} onChange={setMealType} />
      </View>

      {saveError ? (
        <ThemedText variant="footnote" style={{ color: colors.danger }} accessibilityLiveRegion="polite">
          {saveError}
        </ThemedText>
      ) : null}

      <Button label={`Add to ${MEAL_TYPE_META[mealType].label}`} icon="plus" onPress={add} loading={saving} disabled={!portion.stored} />

      <FatSecretAttribution />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
  heading: { gap: Spacing.xxs },
  meal: { gap: Spacing.sm },
  label: { marginLeft: Spacing.xs, letterSpacing: 0.5 },
});

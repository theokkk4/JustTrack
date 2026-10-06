import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { FatSecretAttribution } from '@/components/food/FatSecretAttribution';
import { MealTypePicker } from '@/components/food/MealTypePicker';
import { NutritionSummary } from '@/components/food/NutritionSummary';
import { PortionEditor } from '@/components/food/PortionEditor';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Spacing } from '@/constants/theme';
import { useDiary } from '@/contexts/DiaryContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useDayLog } from '@/hooks/useDayLog';
import { useFood } from '@/hooks/useFood';
import { usePortion } from '@/hooks/usePortion';
import { storedEntryAsFood } from '@/lib/diary/resolve';
import type { StoredPortion } from '@/lib/nutrition/portion';
import type { MealType } from '@/types';
import { confirmAsync } from '@/utils/actionSheet';
import { parseDateKey, toDateKey } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';
import { dateKeyParam, singleParam } from '@/utils/routeParams';

function samePortion(a: StoredPortion, b: StoredPortion): boolean {
  return a.servingId === b.servingId && a.amountUnit === b.amountUnit && Math.abs(a.servings - b.servings) < 0.0001;
}

export default function EditEntryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ id: string; date?: string }>();
  const { today } = useCurrentTime();
  const { updatePortion, moveEntry, duplicateEntry, deleteEntry } = useDiary();

  const entryId = singleParam(params.id);
  const dateKey = dateKeyParam(params.date) ?? toDateKey(today);
  const day = useDayLog(parseDateKey(dateKey) ?? today);
  const entry = day.sections.flatMap((section) => section.items).find((item) => item.id === entryId);
  const record = entry?.record;

  // FatSecret entries are edited against the live food; others against their own stored values.
  const isFatSecret = record?.source === 'fatsecret';
  const fatSecret = useFood(isFatSecret ? record.externalFoodId : null);
  const food = isFatSecret ? fatSecret.food : ((record && storedEntryAsFood(record)) ?? undefined);
  const initialPortion: StoredPortion | null = record
    ? { servingId: isFatSecret ? (record.externalServingId ?? '') : 'entry', servings: record.servings, amountUnit: record.amountUnit }
    : null;
  const portion = usePortion(food, initialPortion);

  const [chosenMealType, setMealType] = useState<MealType | null>(null);
  const mealType = chosenMealType ?? entry?.mealType ?? 'snacks';
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const portionChanged = Boolean(portion.stored && initialPortion && !samePortion(portion.stored, initialPortion));
  const mealChanged = Boolean(entry && mealType !== entry.mealType);
  const canSave = Boolean(entry) && !busy && (mealChanged || (portionChanged && portion.stored !== null));

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (caught) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setActionError(getErrorMessage(caught));
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      if (!entry) return;
      if (portionChanged && food && portion.stored) await updatePortion(entry, food, portion.stored);
      if (mealChanged) await moveEntry(entry, mealType);
    });

  const duplicate = () => run(async () => entry && duplicateEntry(entry));

  const remove = async () => {
    if (!entry) return;
    const confirmed = await confirmAsync({
      title: 'Delete this entry?',
      message: `${entry.foodName} will be removed from ${MEAL_TYPE_META[entry.mealType].label}.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
    deleteEntry(entry).catch((error) => Alert.alert('Couldn’t delete', getErrorMessage(error)));
  };

  const header = (
    <Stack.Screen
      options={{
        title: 'Edit Entry',
        headerLeft: () => <HeaderButton label="Cancel" onPress={() => router.back()} />,
        headerRight: () => <HeaderButton label="Save" emphasized onPress={save} disabled={!canSave} />,
      }}
    />
  );

  if (!entry) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {header}
        {day.status === 'loading' ? (
          <ActivityIndicator color={colors.textSecondary} />
        ) : (
          <EmptyState
            icon="diary"
            title="Entry not found"
            message={day.error ?? 'It may have been deleted on another device.'}
            actionLabel="Close"
            onAction={() => router.back()}
          />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {header}
      <View style={styles.heading}>
        <ThemedText variant="title1" accessibilityRole="header">
          {entry.foodName}
        </ThemedText>
        {entry.brand ? (
          <ThemedText variant="subhead" color="secondary">
            {entry.brand}
          </ThemedText>
        ) : null}
      </View>

      {food ? (
        <>
          <NutritionSummary
            nutrition={portion.nutrition ?? entry}
            caption={portion.description ?? entry.amountLabel}
            estimated={entry.isEstimate}
          />
          <PortionEditor portion={portion} />
        </>
      ) : isFatSecret && fatSecret.error ? (
        <Banner tone="warning" message={fatSecret.error} actionLabel="Retry" onAction={fatSecret.retry} />
      ) : (
        <ActivityIndicator color={colors.textSecondary} />
      )}

      <View style={styles.meal}>
        <ThemedText variant="footnote" color="secondary" style={styles.label}>
          MEAL
        </ThemedText>
        <MealTypePicker value={mealType} onChange={setMealType} />
      </View>

      {actionError ? (
        <ThemedText variant="footnote" style={{ color: colors.danger }} accessibilityLiveRegion="polite">
          {actionError}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <Button label="Save Changes" onPress={save} disabled={!canSave} loading={busy} />
        <Button label="Duplicate" icon="duplicate" variant="secondary" onPress={duplicate} disabled={busy} />
        <Button label="Delete Entry" icon="trash" variant="ghostDestructive" onPress={remove} disabled={busy} />
      </View>

      {isFatSecret ? <FatSecretAttribution /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
  heading: { gap: Spacing.xxs },
  meal: { gap: Spacing.sm },
  label: { marginLeft: Spacing.xs, letterSpacing: 0.5 },
  actions: { gap: Spacing.sm },
});

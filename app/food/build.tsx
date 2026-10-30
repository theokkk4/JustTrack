import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MealTypePicker } from '@/components/food/MealTypePicker';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CloseButton } from '@/components/ui/CloseButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { builderByKey, entryOf, nutritionOf, toggle, type Selection } from '@/lib/food/builders';
import { createEntry, macroShares } from '@/lib/log/entries';
import { addEntries } from '@/lib/log/logStore';
import type { MealType } from '@/types';
import { formatNumber } from '@/utils/format';
import { defaultMealType } from '@/utils/mealTime';
import { mealTypeParam, singleParam } from '@/utils/routeParams';

/** Order at a chain the way you'd order it at the counter; the total is the menu's own numbers added up. */
export default function OrderBuilderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ builder?: string; mealType?: string }>();
  const config = builderByKey(singleParam(params.builder));
  const { now } = useCurrentTime();
  const [mealType, setMealType] = useState<MealType>(() => mealTypeParam(params.mealType) ?? defaultMealType(now));
  const [selection, setSelection] = useState<Selection>(() => config?.defaultSelection ?? {});

  if (!config) {
    return <EmptyState icon="search" title="Nothing to build here" message="Search for Chipotle, Subway, Panda Express, or Jersey Mike’s." actionLabel="Close" onAction={() => router.back()} />;
  }

  const totals = nutritionOf(config, selection);
  const shares = macroShares(totals);
  const extras = config.describe(selection);

  const add = () => {
    addEntries([createEntry(entryOf(config, selection, mealType), new Date())]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Close the whole Add Food modal, not just this screen.
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: config.title, headerLeft: () => null, headerRight: () => <CloseButton onPress={() => router.back()} />, headerTitleAlign: 'center' }} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.summary, shadows.sm, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
          <ThemedText variant="headline" numberOfLines={2}>
            {config.nameOf(selection)}
          </ThemedText>
          <ThemedText variant="footnote" color="secondary" numberOfLines={2}>
            {extras || 'Nothing else yet'}
          </ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText variant="largeTitle" style={styles.tabular}>
              {formatNumber(totals.calories)}
            </ThemedText>
            <ThemedText variant="subhead" color="secondary">
              kcal
            </ThemedText>
            <View style={styles.pills} accessible accessibilityLabel={`Protein ${formatNumber(totals.protein)} grams, carbs ${formatNumber(totals.carbs)} grams, fat ${formatNumber(totals.fat)} grams`}>
              {[
                { label: 'P', grams: totals.protein, share: shares.protein },
                { label: 'C', grams: totals.carbs, share: shares.carbs },
                { label: 'F', grams: totals.fat, share: shares.fat },
              ].map((pill) => (
                <View key={pill.label} style={[styles.pill, { backgroundColor: colors.surface }]}>
                  <ThemedText variant="caption2" color="secondary">
                    {pill.label}
                  </ThemedText>
                  <ThemedText variant="caption2" style={styles.tabular}>
                    {formatNumber(pill.grams)} g
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {config.steps.map((step) => (
          <View key={step.id} style={styles.step}>
            <View style={styles.stepHeader}>
              <ThemedText variant="headline" accessibilityRole="header">
                {step.title}
              </ThemedText>
              {step.hint ? (
                <ThemedText variant="caption1" color="tertiary" style={styles.hint}>
                  {step.hint}
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.chips} accessibilityRole={step.mode === 'one' ? 'radiogroup' : undefined}>
              {step.options.map((option) => {
                const count = selection[option.id] ?? 0;
                const picked = count > 0;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelection((current) => toggle(current, step, option));
                    }}
                    accessibilityRole={step.mode === 'one' ? 'radio' : 'checkbox'}
                    accessibilityLabel={option.label}
                    accessibilityState={{ checked: picked }}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: picked ? colors.fab : colors.surfaceTint, borderColor: picked ? colors.fab : colors.border, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    {picked ? <AppIcon name="check" size={12} color={colors.fabIcon} weight="bold" /> : null}
                    <ThemedText variant="subhead" style={{ color: picked ? colors.fabIcon : colors.text }}>
                      {count === 2 ? `Double ${option.label.toLowerCase()}` : option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.meal}>
          <ThemedText variant="footnote" color="secondary" style={styles.label}>
            ADD TO
          </ThemedText>
          <MealTypePicker value={mealType} onChange={setMealType} />
        </View>
        <ThemedText variant="caption1" color="tertiary" style={styles.footnote}>
          {config.footnote}
        </ThemedText>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={`Add to ${MEAL_TYPE_META[mealType].label} · ${formatNumber(totals.calories)} kcal`} icon="plus" onPress={add} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing['3xl'] },
  summary: { borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, gap: Spacing.xs },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs, marginTop: Spacing.xs },
  pills: { flexDirection: 'row', gap: Spacing.xs, marginLeft: 'auto' },
  pill: { flexDirection: 'row', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full },
  step: { gap: Spacing.sm },
  stepHeader: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: Spacing.sm },
  hint: { flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: Radii.full, borderWidth: StyleSheet.hairlineWidth, minHeight: 40 },
  meal: { gap: Spacing.sm },
  label: { letterSpacing: 0.5, marginLeft: Spacing.xs },
  footnote: { textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  tabular: { fontVariant: ['tabular-nums'] },
});

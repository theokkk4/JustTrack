import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EntryRow } from '@/components/food/EntryRow';
import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useEntryActions } from '@/hooks/useEntryActions';
import { macroShares, type MealSection } from '@/lib/log/entries';
import { formatNumber } from '@/utils/format';

interface MealCardProps {
  section: MealSection;
  onAdd: () => void;
}

/**
 * One meal: name, calories, the macro split as little pills, a + button,
 * and whatever's been logged to it.
 */
export function MealCard({ section, onAdd }: MealCardProps) {
  const { colors, shadows } = useAppTheme();
  const actions = useEntryActions();
  const meta = MEAL_TYPE_META[section.mealType];
  const hasEntries = section.entries.length > 0;
  const shares = macroShares(section.totals);
  const pills = [
    { label: 'Protein', value: shares.protein },
    { label: 'Carbs', value: shares.carbs },
    { label: 'Fat', value: shares.fat },
  ];

  return (
    <View style={[styles.card, shadows.sm, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <ThemedText variant="headline" accessibilityRole="header">
            {meta.label}
          </ThemedText>
          <ThemedText variant="footnote" color="secondary" style={styles.tabular}>
            {hasEntries ? `${formatNumber(section.totals.calories)} kcal` : 'Nothing yet'}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAdd();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Add food to ${meta.label}`}
          hitSlop={6}
          style={({ pressed }) => [styles.addButton, shadows.sm, { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}
        >
          <AppIcon name="plus" size={18} color={colors.text} weight="semibold" />
        </Pressable>
      </View>

      {hasEntries ? (
        <View style={styles.pills} accessible accessibilityLabel={pills.map((pill) => `${pill.label} ${Math.round(pill.value * 100)} percent`).join(', ')}>
          {pills.map((pill) => (
            <View key={pill.label} style={[styles.pill, { backgroundColor: colors.surface }]}>
              <ThemedText variant="caption2" color="secondary">
                {pill.label}
              </ThemedText>
              <ThemedText variant="caption2" style={styles.tabular}>
                {Math.round(pill.value * 100)}%
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      {hasEntries ? (
        <View style={[styles.entries, { borderTopColor: colors.border }]}>
          {section.entries.map((entry, index) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              isLast={index === section.entries.length - 1}
              onOpen={() => actions.open(entry)}
              onDuplicate={() => actions.duplicate(entry)}
              onDelete={() => actions.remove(entry)}
              onMore={() => actions.more(entry)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, paddingBottom: Spacing.md },
  titleBlock: { gap: 2 },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pills: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  pill: { flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs, borderRadius: Radii.full },
  entries: { borderTopWidth: StyleSheet.hairlineWidth },
  tabular: { fontVariant: ['tabular-nums'] },
});

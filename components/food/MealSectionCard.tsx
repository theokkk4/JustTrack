import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useEntryActions } from '@/hooks/useEntryActions';
import type { MealSection } from '@/services/nutritionService';
import { formatCalories } from '@/utils/format';
import { DiaryEntryRow } from './DiaryEntryRow';

interface MealSectionCardProps {
  section: MealSection;
  onAddFood?: () => void;
}

export function MealSectionCard({ section, onAddFood }: MealSectionCardProps) {
  const { colors } = useAppTheme();
  const actions = useEntryActions();
  const meta = MEAL_TYPE_META[section.mealType];
  const hasItems = section.items.length > 0;

  return (
    <Card padded={false} style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <AppIcon name={meta.icon} size={18} color={colors.textSecondary} />
          <ThemedText variant="headline" accessibilityRole="header">
            {meta.label}
          </ThemedText>
        </View>
        <ThemedText variant="subheadEmphasized" color={hasItems ? 'primary' : 'tertiary'} style={styles.tabular}>
          {formatCalories(section.totals.calories)}
        </ThemedText>
      </View>

      {section.items.map((item, index) => (
        <DiaryEntryRow
          key={item.id}
          item={item}
          isLast={index === section.items.length - 1 && !onAddFood}
          onOpen={() => actions.open(item)}
          onDuplicate={() => actions.duplicate(item)}
          onDelete={() => actions.remove(item)}
          onMore={() => actions.more(item)}
        />
      ))}

      {onAddFood ? (
        <Pressable
          onPress={onAddFood}
          accessibilityRole="button"
          accessibilityLabel={`Add food to ${meta.label}`}
          style={({ pressed }) => [styles.addRow, pressed && { backgroundColor: colors.backgroundSecondary }]}
        >
          <AppIcon name="plusCircle" size={20} color={colors.accent} />
          <ThemedText variant="subheadEmphasized" style={{ color: colors.accent }}>
            Add food
          </ThemedText>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  tabular: { fontVariant: ['tabular-nums'] },
});

import React from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { MealItem } from '@/types';
import { formatCalories, formatNumber } from '@/utils/format';

interface FoodRowProps extends Pick<PressableProps, 'accessibilityActions' | 'onAccessibilityAction'> {
  item: MealItem;
  onPress?: () => void;
  onLongPress?: () => void;
  isLast?: boolean;
}

export function describeEntry(item: MealItem): string {
  if (!item.resolved) return `${item.foodName}, ${item.amountLabel}. Nutrition details couldn’t load.`;
  const estimate = item.isEstimate ? 'Estimated: ' : '';
  return `${item.foodName}, ${item.amountLabel}. ${estimate}${formatCalories(item.calories)}, ${formatNumber(item.protein)} grams protein.`;
}

export function FoodRow({ item, onPress, onLongPress, isLast = false, accessibilityActions, onAccessibilityAction }: FoodRowProps) {
  const { colors } = useAppTheme();
  const detail = [item.brand, item.amountLabel].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={describeEntry(item)}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.backgroundSecondary : colors.surface },
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.details}>
        <ThemedText variant="body" numberOfLines={1} color={item.resolved ? 'primary' : 'secondary'}>
          {item.foodName}
        </ThemedText>
        <View style={styles.detailRow}>
          {item.isEstimate ? (
            <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary }]}>
              <ThemedText variant="caption2" color="secondary">
                ESTIMATED
              </ThemedText>
            </View>
          ) : null}
          <ThemedText variant="footnote" color="secondary" numberOfLines={1} style={styles.detailText}>
            {detail}
          </ThemedText>
        </View>
      </View>
      <View style={styles.nutrition}>
        <ThemedText variant="subheadEmphasized" color={item.resolved ? 'primary' : 'tertiary'} style={styles.tabular}>
          {item.resolved ? formatCalories(item.calories) : '— cal'}
        </ThemedText>
        {item.resolved ? (
          <ThemedText variant="footnote" color="secondary" style={styles.tabular}>
            {formatNumber(item.protein)}g protein
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    minHeight: 60,
  },
  details: { flex: 1, gap: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  detailText: { flexShrink: 1 },
  badge: { paddingHorizontal: Spacing.xs + 2, paddingVertical: 1, borderRadius: Radii.full },
  nutrition: { alignItems: 'flex-end', gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
});

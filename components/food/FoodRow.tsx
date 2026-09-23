import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { MealItem } from '@/types';
import { formatCalories, formatNumber } from '@/utils/format';

interface FoodRowProps {
  item: MealItem;
  onPress?: () => void;
  isLast?: boolean;
}

export function FoodRow({ item, onPress, isLast = false }: FoodRowProps) {
  const { colors } = useAppTheme();
  const portion = item.brand ? `${item.brand} · ${formatNumber(item.grams)}g` : `${formatNumber(item.grams)}g`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${item.foodName}, ${portion}, ${formatCalories(item.calories)}, ${formatNumber(item.protein)} grams protein`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.backgroundSecondary : 'transparent' },
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.details}>
        <ThemedText variant="body" numberOfLines={1}>
          {item.foodName}
        </ThemedText>
        <ThemedText variant="footnote" color="secondary" numberOfLines={1}>
          {portion}
        </ThemedText>
      </View>
      <View style={styles.nutrition}>
        <ThemedText variant="subheadEmphasized" style={styles.tabular}>
          {formatCalories(item.calories)}
        </ThemedText>
        <ThemedText variant="footnote" color="secondary" style={styles.tabular}>
          {formatNumber(item.protein)}g protein
        </ThemedText>
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
  },
  details: { flex: 1, gap: 2 },
  nutrition: { alignItems: 'flex-end', gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
});

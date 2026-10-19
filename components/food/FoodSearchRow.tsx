import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { defaultServing } from '@/lib/nutrition/portion';
import type { FoodDetail } from '@/types';
import { formatNumber } from '@/utils/format';

interface FoodSearchRowProps {
  food: FoodDetail;
  onPress: () => void;
}

export function FoodSearchRow({ food, onPress }: FoodSearchRowProps) {
  const { colors } = useAppTheme();
  const serving = defaultServing(food);
  const detail = [food.brand, serving.description].filter(Boolean).join(' · ');
  const calories = `${formatNumber(serving.calories)} cal`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[food.name, food.brand, `${calories} per ${serving.description}`].filter(Boolean).join(', ')}
      accessibilityHint="Choose an amount and add it to your diary"
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.backgroundSecondary }]}
    >
      <View style={styles.text}>
        <ThemedText variant="body" numberOfLines={2}>
          {food.name}
        </ThemedText>
        <ThemedText variant="footnote" color="secondary" numberOfLines={1}>
          {detail}
        </ThemedText>
      </View>
      <ThemedText variant="subheadEmphasized" color="secondary" style={styles.tabular}>
        {calories}
      </ThemedText>
      <AppIcon name="chevronRight" size={13} color={colors.textTertiary} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  text: { flex: 1, gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
});

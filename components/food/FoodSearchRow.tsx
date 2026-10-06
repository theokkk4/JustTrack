import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { FoodSearchResult } from '@/types';
import { formatNumber } from '@/utils/format';

interface FoodSearchRowProps {
  result: FoodSearchResult;
  onPress: () => void;
}

export function FoodSearchRow({ result, onPress }: FoodSearchRowProps) {
  const { colors } = useAppTheme();
  const basis = result.basis ? `Per ${result.basis}` : null;
  const detail = [result.brand, basis].filter(Boolean).join(' · ');
  const calories = result.calories !== null ? `${formatNumber(result.calories)} cal` : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[result.name, result.brand, calories && basis ? `${calories} ${basis.toLowerCase()}` : null].filter(Boolean).join(', ')}
      accessibilityHint="Choose an amount and add it to your diary"
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.backgroundSecondary }]}
    >
      <View style={styles.text}>
        <ThemedText variant="body" numberOfLines={2}>
          {result.name}
        </ThemedText>
        {detail ? (
          <ThemedText variant="footnote" color="secondary" numberOfLines={1}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
      {calories ? (
        <ThemedText variant="subheadEmphasized" color="secondary" style={styles.tabular}>
          {calories}
        </ThemedText>
      ) : null}
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

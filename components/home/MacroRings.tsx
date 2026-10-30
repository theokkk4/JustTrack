import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Ring } from '@/components/ui/Ring';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { macroShares } from '@/lib/log/entries';
import type { MacroGoals, NutritionValues } from '@/types';
import { formatNumber } from '@/utils/format';

interface MacroRingsProps {
  totals: NutritionValues;
  /** With targets set, each tile shows grams left; otherwise its share of today's calories. */
  goals?: MacroGoals | null;
}

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
] as const;

/** Three white tiles, one gauge each: protein, carbs, fat. */
export function MacroRings({ totals, goals }: MacroRingsProps) {
  const { colors, shadows } = useAppTheme();
  const shares = macroShares(totals);

  return (
    <View style={styles.row}>
      {MACROS.map(({ key, label }) => {
        const eaten = totals[key];
        const goal = goals?.[key] ?? 0;
        const left = goal - eaten;
        const progress = goals ? (goal > 0 ? eaten / goal : 0) : shares[key];
        const headline = goals ? `${formatNumber(Math.abs(left))}g` : `${Math.round(shares[key] * 100)}%`;
        const caption = goals ? `${label} ${left < 0 ? 'over' : 'left'}` : label;
        return (
          <View
            key={key}
            style={[styles.tile, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessible
            accessibilityLabel={goals ? `${label}: ${formatNumber(eaten)} of ${formatNumber(goal)} grams, ${headline} ${left < 0 ? 'over' : 'left'}` : `${label} ${headline} of today's calories`}
          >
            <ThemedText variant="headline" style={styles.tabular}>
              {headline}
            </ThemedText>
            <ThemedText variant="caption1" color="secondary">
              {caption}
            </ThemedText>
            <View style={styles.ring}>
              <Ring progress={progress} size={44} stroke={5} color={colors[key]} trackColor={colors.backgroundSecondary}>
                <View style={[styles.dot, { backgroundColor: colors[key] }]} />
              </Ring>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  tile: { flex: 1, borderRadius: Radii.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.md, alignItems: 'center', gap: 2 },
  ring: { marginTop: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
});

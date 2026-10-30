import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { addDays, isSameDay, startOfWeek } from '@/utils/date';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * This week, Monday to Sunday, with today lit up. The log only holds the
 * last 24 hours, so the other days are context rather than buttons.
 */
export function WeekStrip({ today }: { today: Date }) {
  const { colors } = useAppTheme();
  const monday = startOfWeek(today);
  const days = LETTERS.map((letter, index) => ({ letter, date: addDays(monday, index) }));
  const label = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={`Today is ${label}`}>
      {days.map(({ letter, date }) => {
        const isToday = isSameDay(date, today);
        return (
          <View key={date.toISOString()} style={[styles.day, isToday && { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
            <ThemedText variant="caption2" style={{ color: isToday ? colors.onGradient : colors.onGradientMuted }}>
              {letter}
            </ThemedText>
            <ThemedText variant="subheadEmphasized" style={[styles.number, { color: isToday ? colors.onGradient : colors.onGradientMuted }]}>
              {date.getDate()}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.lg },
  day: { width: 40, paddingVertical: Spacing.sm, borderRadius: Radii.md, alignItems: 'center', gap: 2 },
  number: { fontVariant: ['tabular-nums'] },
});

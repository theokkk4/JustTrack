import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { addDays, isSameDay, startOfWeek } from '@/utils/date';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeekStripProps {
  today: Date;
  selected: Date;
  onSelect: (day: Date) => void;
}

/** This week as a row of white chips, Monday to Sunday. Tap a day to look at it; days still to come are quiet. */
export function WeekStrip({ today, selected, onSelect }: WeekStripProps) {
  const { colors, isDark } = useAppTheme();
  const monday = startOfWeek(selected);
  const days = DAYS.map((name, index) => ({ name, date: addDays(monday, index) }));
  const chip = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.78)';

  return (
    <View style={styles.row}>
      {days.map(({ name, date }) => {
        const isSelected = isSameDay(date, selected);
        const isToday = isSameDay(date, today);
        const future = date > today;
        const ink = isSelected ? '#FFFFFF' : isDark ? colors.onGradient : colors.text;
        return (
          <Pressable
            key={date.toISOString()}
            disabled={future}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(date);
            }}
            accessibilityRole="button"
            accessibilityLabel={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            accessibilityState={{ selected: isSelected, disabled: future }}
            style={({ pressed }) => [styles.day, { backgroundColor: isSelected ? colors.accent : chip, opacity: future ? 0.45 : pressed ? 0.75 : 1 }]}
          >
            <ThemedText variant="caption2" style={{ color: ink, opacity: isSelected ? 0.85 : 0.7 }}>
              {name}
            </ThemedText>
            <ThemedText variant="subheadEmphasized" style={[styles.number, { color: ink }]}>
              {date.getDate()}
            </ThemedText>
            <View style={[styles.dot, { backgroundColor: isToday ? ink : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: Spacing.lg },
  day: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radii.md, alignItems: 'center', gap: 1 },
  number: { fontVariant: ['tabular-nums'] },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});

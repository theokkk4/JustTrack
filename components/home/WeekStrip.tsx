import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { addDays, isSameDay, startOfWeek } from '@/utils/date';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface WeekStripProps {
  today: Date;
  selected: Date;
  onSelect: (day: Date) => void;
}

/** This week, Monday to Sunday. Tap a day to look at it; days still to come are quiet. */
export function WeekStrip({ today, selected, onSelect }: WeekStripProps) {
  const { colors } = useAppTheme();
  const monday = startOfWeek(selected);
  const days = LETTERS.map((letter, index) => ({ letter, date: addDays(monday, index) }));

  return (
    <View style={styles.row}>
      {days.map(({ letter, date }) => {
        const isSelected = isSameDay(date, selected);
        const isToday = isSameDay(date, today);
        const future = date > today;
        const color = isSelected ? colors.onGradient : future ? 'rgba(255,255,255,0.45)' : colors.onGradientMuted;
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
            style={({ pressed }) => [styles.day, isSelected && { backgroundColor: 'rgba(255,255,255,0.22)' }, pressed && { opacity: 0.7 }]}
          >
            <ThemedText variant="caption2" style={{ color }}>
              {letter}
            </ThemedText>
            <ThemedText variant="subheadEmphasized" style={[styles.number, { color }]}>
              {date.getDate()}
            </ThemedText>
            <View style={[styles.dot, { backgroundColor: isToday ? colors.onGradient : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.lg },
  day: { width: 40, paddingVertical: Spacing.sm, borderRadius: Radii.md, alignItems: 'center', gap: 2 },
  number: { fontVariant: ['tabular-nums'] },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});

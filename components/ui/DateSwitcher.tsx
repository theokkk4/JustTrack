import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { addDays, formatRelativeDay, isSameDay } from '@/utils/date';
import { AppIcon } from './AppIcon';
import { ThemedText } from './ThemedText';

interface DateSwitcherProps {
  date: Date;
  today: Date;
  onChange: (date: Date) => void;
}

export function DateSwitcher({ date, today, onChange }: DateSwitcherProps) {
  const { colors } = useAppTheme();
  const isToday = isSameDay(date, today);

  const step = (days: number) => {
    Haptics.selectionAsync();
    onChange(addDays(date, days));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Pressable
        onPress={() => step(-1)}
        accessibilityRole="button"
        accessibilityLabel="Previous day"
        hitSlop={8}
        style={styles.arrow}
      >
        <AppIcon name="chevronLeft" size={16} color={colors.text} weight="semibold" />
      </Pressable>
      <Pressable
        onPress={() => !isToday && onChange(today)}
        accessibilityRole="button"
        accessibilityLabel={`Showing ${formatRelativeDay(date, today)}${isToday ? '' : '. Tap to jump to today'}`}
        style={styles.label}
      >
        <ThemedText variant="headline">{formatRelativeDay(date, today)}</ThemedText>
      </Pressable>
      <Pressable
        onPress={() => step(1)}
        disabled={isToday}
        accessibilityRole="button"
        accessibilityLabel="Next day"
        accessibilityState={{ disabled: isToday }}
        hitSlop={8}
        style={[styles.arrow, isToday && styles.disabled]}
      >
        <AppIcon name="chevronRight" size={16} color={colors.text} weight="semibold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  arrow: { padding: Spacing.sm },
  label: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs },
  disabled: { opacity: 0.3 },
});

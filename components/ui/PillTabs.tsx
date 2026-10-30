import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface PillTabsProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** A soft segmented control: a lavender track with a white pill on the chosen option. */
export function PillTabs<T extends string>({ options, value, onChange, accessibilityLabel }: PillTabsProps<T>) {
  const { colors, shadows } = useAppTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.backgroundSecondary }]} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync();
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.pill, selected && [styles.selected, shadows.sm, { backgroundColor: colors.surface }]]}
          >
            <ThemedText variant={selected ? 'subheadEmphasized' : 'subhead'} color={selected ? 'primary' : 'secondary'}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, borderRadius: Radii.full },
  pill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: Radii.full, minHeight: 36 },
  selected: {},
});

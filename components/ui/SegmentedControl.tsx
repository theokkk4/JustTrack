import NativeSegmentedControl from '@react-native-segmented-control/segmented-control';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/contexts/ThemeContext';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** iOS's native UISegmentedControl, themed to the app's light/dark preference. */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const { isDark } = useAppTheme();

  return (
    <NativeSegmentedControl
      values={options.map((option) => option.label)}
      selectedIndex={options.findIndex((option) => option.value === value)}
      appearance={isDark ? 'dark' : 'light'}
      accessibilityLabel={accessibilityLabel}
      onChange={(event) => {
        const option = options[event.nativeEvent.selectedSegmentIndex];
        if (option && option.value !== value) {
          Haptics.selectionAsync();
          onChange(option.value);
        }
      }}
      style={styles.control}
    />
  );
}

const styles = StyleSheet.create({
  control: { height: 36 },
});

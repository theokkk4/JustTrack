import React from 'react';
import { Pressable } from 'react-native';

import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface HeaderButtonProps {
  label: string;
  onPress: () => void;
  emphasized?: boolean;
  disabled?: boolean;
}

/** A text button for a navigation bar ("Cancel", "Save"). */
export function HeaderButton({ label, onPress, emphasized = false, disabled = false }: HeaderButtonProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} hitSlop={10}>
      <ThemedText
        variant={emphasized ? 'bodyEmphasized' : 'body'}
        style={{ color: disabled ? colors.textTertiary : emphasized ? colors.accent : colors.text }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

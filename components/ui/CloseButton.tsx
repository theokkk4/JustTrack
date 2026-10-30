import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon } from './AppIcon';

interface CloseButtonProps {
  onPress: () => void;
  label?: string;
  /** Sits over a photo or the camera: frosted white instead of lavender. */
  onPhoto?: boolean;
  /** Back chevron instead of an X, for a screen that was pushed rather than presented. */
  back?: boolean;
}

/** The one way to leave a modal: a round button with an X, top corner, every time. */
export function CloseButton({ onPress, label, onPhoto = false, back = false }: CloseButtonProps) {
  const { colors, isDark } = useAppTheme();
  const background = onPhoto ? (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.8)') : colors.surfaceTint;
  const ink = onPhoto && isDark ? '#FFFFFF' : colors.text;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label ?? (back ? 'Back' : 'Close')}
      hitSlop={10}
      style={({ pressed }) => [styles.button, { backgroundColor: background, opacity: pressed ? 0.7 : 1 }]}
    >
      <AppIcon name={back ? 'chevronLeft' : 'close'} size={back ? 18 : 16} color={ink} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

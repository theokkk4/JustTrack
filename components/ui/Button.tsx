import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon, type AppIconName } from './AppIcon';
import { ThemedText } from './ThemedText';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  icon?: AppIconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  icon,
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = true,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors } = useAppTheme();

  const palette = {
    primary: { bg: colors.text, fg: colors.textInverse, border: 'transparent' },
    secondary: { bg: colors.backgroundSecondary, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.text, border: 'transparent' },
    destructive: { bg: colors.danger, fg: colors.textInverse, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={(event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: pressed ? 0.85 : disabled ? 0.4 : 1 },
        fullWidth && styles.fullWidth,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <AppIcon name={icon} size={18} color={palette.fg} weight="semibold" /> : null}
          <ThemedText variant="bodyEmphasized" style={{ color: palette.fg }}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  md: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  fullWidth: { alignSelf: 'stretch' },
});

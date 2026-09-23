import React from 'react';
import { Text, type TextProps } from 'react-native';

import { Typography, type TypographyVariant } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface ThemedTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse';
}

/**
 * The app's only Text component. Scales with the user's Dynamic Type
 * setting by default (never sets allowFontScaling=false) and always pulls
 * color from the active theme rather than a hardcoded value.
 */
export function ThemedText({ variant = 'body', color = 'primary', style, ...rest }: ThemedTextProps) {
  const { colors } = useAppTheme();

  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    inverse: colors.textInverse,
  } as const;

  return <Text style={[Typography[variant], { color: colorMap[color] }, style]} {...rest} />;
}

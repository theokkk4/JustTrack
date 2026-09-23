import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ padded = true, elevated = 'sm', style, children, ...rest }: CardProps) {
  const { colors, shadows } = useAppTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        padded && styles.padded,
        elevated !== 'none' && shadows[elevated],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: Spacing.lg,
  },
});

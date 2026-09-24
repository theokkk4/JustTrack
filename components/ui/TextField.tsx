import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface TextFieldProps extends TextInputProps {
  label: string;
  suffix?: string;
  error?: string | null;
  ref?: React.Ref<TextInput>;
}

export function TextField({ label, suffix, error, style, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.text : 'transparent';

  return (
    <View style={styles.container}>
      <ThemedText variant="footnote" color="secondary" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.field, { backgroundColor: colors.backgroundSecondary, borderColor }]}>
        <TextInput
          {...rest}
          ref={ref}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          style={[Typography.body, styles.input, { color: colors.text }, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {suffix ? (
          <ThemedText variant="body" color="secondary">
            {suffix}
          </ThemedText>
        ) : null}
      </View>
      {error ? (
        <ThemedText variant="footnote" style={{ color: colors.danger }} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs, flex: 1 },
  label: { marginLeft: Spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
    gap: Spacing.sm,
  },
  input: { flex: 1, paddingVertical: Spacing.md },
});

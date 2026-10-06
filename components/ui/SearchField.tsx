import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon } from './AppIcon';

interface SearchFieldProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  loading?: boolean;
  ref?: React.Ref<TextInput>;
}

/** An iOS-style search field: magnifier, clear button, and an optional spinner while results load. */
export function SearchField({ value, onChangeText, loading = false, placeholder = 'Search', ref, ...rest }: SearchFieldProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.field, { backgroundColor: colors.backgroundSecondary }]}>
      <AppIcon name="search" size={17} color={colors.textSecondary} />
      <TextInput
        {...rest}
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityRole="search"
        accessibilityLabel={rest.accessibilityLabel ?? placeholder}
        style={[Typography.body, styles.input, { color: colors.text }]}
      />
      {loading ? <ActivityIndicator size="small" color={colors.textSecondary} /> : null}
      {value.length > 0 && !loading ? (
        <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
          <AppIcon name="closeCircle" size={17} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  input: { flex: 1, paddingVertical: Spacing.sm },
});

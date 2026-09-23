import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface ScreenProps extends ScrollViewProps {
  scroll?: boolean;
  edges?: Edge[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

/**
 * Base container for every tab/stack screen: themed background, safe-area
 * aware, and optionally scrollable with pull-to-refresh wired in.
 */
export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  onRefresh,
  refreshing = false,
  contentContainerStyle,
  ...rest
}: ScreenProps) {
  const { colors } = useAppTheme();

  if (!scroll) {
    return (
      <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.flex, styles.padded]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />
          ) : undefined
        }
        {...rest}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: Spacing.lg },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['4xl'] },
});

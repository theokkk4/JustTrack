import React from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CONTENT_MAX_WIDTH } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * On a phone, the app fills the screen. On a laptop, it sits as a phone-width
 * column in the middle of a soft lavender page, so it reads like the app it is.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { colors, shadows } = useAppTheme();
  const { width } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > CONTENT_MAX_WIDTH + 48;

  if (!framed) return <>{children}</>;

  return (
    <View style={[styles.page, { backgroundColor: colors.backdrop }]}>
      <View style={[styles.column, shadows.lg, { backgroundColor: colors.background, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  column: {
    width: CONTENT_MAX_WIDTH,
    flex: 1,
    maxHeight: 920,
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});

import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';

export const FATSECRET_URL = 'https://platform.fatsecret.com';
export const FATSECRET_ATTRIBUTION = 'Powered by fatsecret Platform API';

/**
 * FatSecret's required attribution, linked to their platform site. Shown
 * wherever their food data is displayed, and on the signed-out Welcome screen.
 */
export function FatSecretAttribution({ style, color = 'tertiary' }: { style?: StyleProp<ViewStyle>; color?: 'secondary' | 'tertiary' }) {
  return (
    <Pressable
      onPress={() => void WebBrowser.openBrowserAsync(FATSECRET_URL)}
      accessibilityRole="link"
      accessibilityLabel={`${FATSECRET_ATTRIBUTION}. Opens platform.fatsecret.com.`}
      hitSlop={8}
      style={[styles.container, style]}
    >
      <ThemedText variant="caption1" color={color} style={styles.text}>
        {FATSECRET_ATTRIBUTION}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', paddingVertical: Spacing.sm },
  text: { textDecorationLine: 'underline', textAlign: 'center' },
});

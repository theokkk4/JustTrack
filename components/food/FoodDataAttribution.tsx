import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';

const SOURCES = [
  { label: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov' },
  { label: 'Open Food Facts', url: 'https://world.openfoodfacts.org' },
  { label: 'FatSecret', url: 'https://platform.fatsecret.com' },
] as const;

/**
 * Credits the data behind food search: USDA FoodData Central (public domain),
 * Open Food Facts (ODbL), and FatSecret (restaurant menus; asks to be credited).
 */
export function FoodDataAttribution({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      <ThemedText variant="caption1" color="tertiary">
        Food data:
      </ThemedText>
      {SOURCES.map((source, index) => (
        <React.Fragment key={source.url}>
          {index > 0 ? (
            <ThemedText variant="caption1" color="tertiary">
              ·
            </ThemedText>
          ) : null}
          <Pressable
            onPress={() => void WebBrowser.openBrowserAsync(source.url)}
            accessibilityRole="link"
            accessibilityLabel={`${source.label}. Opens their website.`}
            hitSlop={8}
          >
            <ThemedText variant="caption1" color="tertiary" style={styles.link}>
              {source.label}
            </ThemedText>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  link: { textDecorationLine: 'underline' },
});

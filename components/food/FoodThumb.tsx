import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ImageStyle } from 'expo-image';

import { foodEmojiFor } from '@/lib/food/foodEmoji';
import { heroTintFor } from '@/lib/food/heroTint';

interface FoodThumbProps {
  name: string;
  /** Category, brand… anything that helps pick the emoji and tint. */
  hints?: (string | null | undefined)[];
  /** A product photo or the user's own meal photo; wins over the emoji. */
  imageUri?: string | null;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle & ImageStyle>;
}

/** A food's picture: its photo when there is one, otherwise an emoji on a tinted tile. */
export function FoodThumb({ name, hints = [], imageUri, size = 44, radius = 12, style }: FoodThumbProps) {
  const box = { width: size, height: size, borderRadius: radius };
  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[box, styles.image, style]} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />;
  }
  const [start, end] = heroTintFor(...hints, name);
  return (
    <LinearGradient colors={[start, end]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[box, styles.tile, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={{ fontSize: Math.round(size * 0.5), lineHeight: Math.round(size * 0.65) }} accessible={false}>
        {foodEmojiFor(name, ...hints)}
      </Text>
    </LinearGradient>
  );
}

/** Lets a list of thumbs look like a stack of photos, e.g. on a meal card. */
export function FoodThumbStack({ items, size = 32 }: { items: { name: string; imageUri?: string | null; hints?: (string | null | undefined)[] }[]; size?: number }) {
  return (
    <View style={styles.stack}>
      {items.slice(0, 3).map((item, index) => (
        <FoodThumb key={`${item.name}-${index}`} {...item} size={size} radius={size / 2} style={[styles.stacked, index > 0 && { marginLeft: -size * 0.3 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#ECE9F8' },
  tile: { alignItems: 'center', justifyContent: 'center' },
  stack: { flexDirection: 'row', alignItems: 'center' },
  stacked: { borderWidth: 2, borderColor: '#FFFFFF' },
});

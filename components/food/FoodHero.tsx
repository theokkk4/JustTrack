import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { heroTintFor } from '@/lib/food/heroTint';

interface FoodHeroProps {
  title: string;
  subtitle?: string | null;
  /** Right-aligned headline, e.g. "150 g". */
  amount?: string | null;
  amountCaption?: string | null;
  /** A photo to show instead of the tint: a product shot, or the user's own meal photo. */
  imageUri?: string | null;
  /** Used to choose the tint when there's no photo. */
  tintHints?: (string | null | undefined)[];
  badge?: string | null;
  onBack?: () => void;
}

/**
 * The top of a food screen: a photo (or a category-tinted gradient) with
 * the food's name and amount set over it, like a magazine cover.
 */
export function FoodHero({ title, subtitle, amount, amountCaption, imageUri, tintHints = [], badge, onBack }: FoodHeroProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tintStart, tintEnd] = heroTintFor(...tintHints, title);

  return (
    <View style={styles.hero}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
      ) : (
        <LinearGradient colors={[tintStart, tintEnd]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={['rgba(20,12,40,0.55)', 'rgba(20,12,40,0.05)', 'rgba(20,12,40,0.55)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={styles.backButton}>
            <AppIcon name="chevronLeft" size={18} color="#FFFFFF" weight="semibold" />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        {badge ? (
          <View style={styles.badge}>
            <ThemedText variant="caption2" style={styles.badgeText}>
              {badge}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.titles}>
        <View style={styles.titleBlock}>
          <ThemedText variant="title1" style={styles.onPhoto} numberOfLines={3} accessibilityRole="header">
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText variant="subhead" style={styles.onPhotoMuted} numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {amount ? (
          <View style={styles.amountBlock}>
            <ThemedText variant="title1" style={[styles.onPhoto, styles.tabular]}>
              {amount}
            </ThemedText>
            {amountCaption ? (
              <ThemedText variant="footnote" style={styles.onPhotoMuted}>
                {amountCaption}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={[styles.lip, { backgroundColor: colors.background }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 340, justifyContent: 'space-between', overflow: 'hidden' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  badge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full },
  badgeText: { color: '#17142B', letterSpacing: 0.5 },
  titles: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },
  titleBlock: { flex: 1, gap: 2 },
  amountBlock: { alignItems: 'flex-end' },
  onPhoto: { color: '#FFFFFF' },
  onPhotoMuted: { color: 'rgba(255,255,255,0.8)' },
  tabular: { fontVariant: ['tabular-nums'] },
  lip: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 24, borderTopLeftRadius: Radii['2xl'], borderTopRightRadius: Radii['2xl'] },
});

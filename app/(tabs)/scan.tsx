import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useMealScan } from '@/hooks/useMealScan';

function Action({ icon, label, onPress, disabled }: { icon: AppIconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [styles.action, { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}
    >
      <AppIcon name={icon} size={20} color="#17142B" weight="semibold" />
      <ThemedText variant="subheadEmphasized" style={styles.actionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** The hero feature: photograph a meal, get an estimate. Barcodes and search sit underneath. */
export default function ScanScreen() {
  const router = useRouter();
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { scan, busy } = useMealScan();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
      <ThemedText variant="largeTitle" accessibilityRole="header">
        Scan
      </ThemedText>
      <ThemedText variant="body" color="secondary" style={styles.lede}>
        Point your camera at the plate. JustTrack names what’s on it and estimates the calories — you check it, then log it.
      </ThemedText>

      <LinearGradient colors={[colors.gradientStart, colors.gradientMiddle]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroCard, shadows.lg]}>
        <View style={styles.heroBadge}>
          <AppIcon name="sparkles" size={14} color="#FFFFFF" />
          <ThemedText variant="caption2" style={styles.heroBadgeText}>
            AI ESTIMATE
          </ThemedText>
        </View>
        <ThemedText variant="title1" style={styles.heroTitle} accessibilityRole="header">
          Snap your meal
        </ThemedText>
        <ThemedText variant="subhead" style={styles.heroText}>
          Works best with the whole plate in frame and decent light.
        </ThemedText>
        <View style={styles.actions}>
          <Action icon="camera" label="Take photo" onPress={() => void scan('camera')} disabled={busy} />
          <Action icon="photo" label="Choose photo" onPress={() => void scan('library')} disabled={busy} />
        </View>
      </LinearGradient>

      <Pressable
        onPress={() => router.push('/scan/barcode')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, shadows.sm, { backgroundColor: colors.surfaceTint, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
          <AppIcon name="barcode" size={24} color={colors.text} />
        </View>
        <View style={styles.cardText}>
          <ThemedText variant="headline">Scan a barcode</ThemedText>
          <ThemedText variant="footnote" color="secondary">
            Packaged foods, straight from the label.
          </ThemedText>
        </View>
        <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
      </Pressable>

      <Pressable
        onPress={() => router.push('/food/search')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, shadows.sm, { backgroundColor: colors.surfaceTint, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
          <AppIcon name="search" size={22} color={colors.text} />
        </View>
        <View style={styles.cardText}>
          <ThemedText variant="headline">Search by name</ThemedText>
          <ThemedText variant="footnote" color="secondary">
            5,000+ everyday foods, plus packaged brands.
          </ThemedText>
        </View>
        <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
      </Pressable>

      <ThemedText variant="caption1" color="tertiary" style={styles.footnote}>
        Photo estimates are a starting point, not a measurement. Photos are analyzed and not kept.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'], gap: Spacing.md },
  lede: { marginBottom: Spacing.sm },
  heroCard: { borderRadius: Radii['2xl'], padding: Spacing['2xl'], gap: Spacing.sm },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radii.full },
  heroBadgeText: { color: '#FFFFFF', letterSpacing: 0.6 },
  heroTitle: { color: '#FFFFFF', marginTop: Spacing.sm },
  heroText: { color: 'rgba(255,255,255,0.8)' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: '#FFFFFF', borderRadius: Radii.lg, paddingVertical: Spacing.md, minHeight: 48 },
  actionLabel: { color: '#17142B' },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth },
  iconTile: { width: 48, height: 48, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 2 },
  footnote: { textAlign: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
});

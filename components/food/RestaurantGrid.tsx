import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChainLogo } from '@/components/food/ChainLogo';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { FEATURED_CHAINS, shortChainName } from '@/lib/food/chainLogos';

interface RestaurantGridProps {
  onSelect: (chain: string) => void;
}

/** Four logos a row: what you see on Add Food before typing anything. Tap one to browse its menu. */
export function RestaurantGrid({ onSelect }: RestaurantGridProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.grid} accessibilityRole="list">
      {FEATURED_CHAINS.map((chain) => (
        <Pressable
          key={chain}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(chain);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${chain} menu`}
          style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
        >
          <ChainLogo chain={chain} size={64} radius={Radii.lg} />
          <ThemedText variant="caption1" color="secondary" numberOfLines={1} style={styles.label}>
            {shortChainName(chain)}
          </ThemedText>
        </Pressable>
      ))}
      <ThemedText variant="caption1" color="tertiary" style={[styles.foot, { color: colors.textTertiary }]}>
        Or search anything above: everyday foods, brands, barcodes.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, rowGap: Spacing.lg },
  cell: { width: '25%', alignItems: 'center', gap: Spacing.xs },
  label: { textAlign: 'center', paddingHorizontal: 2 },
  foot: { width: '100%', textAlign: 'center', paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
});

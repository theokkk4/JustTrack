import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScanOptionCard } from '@/components/scanner/ScanOptionCard';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';

export default function ScanScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText variant="largeTitle" accessibilityRole="header">
          Scan
        </ThemedText>
        <ThemedText variant="body" color="secondary">
          The fastest way to log what you eat.
        </ThemedText>
      </View>

      <View style={styles.options}>
        <ScanOptionCard
          prominent
          icon="camera"
          title="Scan a meal"
          badge="AI"
          description="Photograph your plate for an estimate of what's on it."
        />
        <ScanOptionCard icon="barcode" title="Scan a barcode" description="Point at a package barcode for its nutrition facts." />
        <ScanOptionCard icon="search" title="Search foods" description="Look up any food by name." />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Spacing.lg, paddingBottom: Spacing['2xl'], gap: Spacing.xs },
  options: { gap: Spacing.md },
});

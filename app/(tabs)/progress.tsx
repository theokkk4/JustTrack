import React from 'react';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';

export default function ProgressScreen() {
  return (
    <Screen>
      <ThemedText variant="largeTitle" accessibilityRole="header" style={styles.title}>
        Progress
      </ThemedText>
      <Card padded={false}>
        <EmptyState
          icon="progress"
          title="Your trends will show up here"
          message="Log meals for a few days to see calorie and protein averages, weight history, and consistency."
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
});

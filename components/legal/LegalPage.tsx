import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseButton } from '@/components/ui/CloseButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';

export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
}

interface LegalPageProps {
  title: string;
  /** e.g. "Updated October 30, 2026". */
  dateline: string;
  intro: string;
  sections: readonly LegalSection[];
}

/**
 * A plain, readable page for the privacy policy and support: reachable from
 * Profile in the app and by URL on the web (App Store Connect needs both).
 * Opens on its own on the web, so the close button falls back to Home.
 */
export function LegalPage({ title, dateline, intro, sections }: LegalPageProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { welcomed } = useSettings();

  // Opened by URL there is nothing to go back to; Home only exists once the user has been welcomed.
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(welcomed ? '/' : '/welcome');
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, Spacing.md), paddingBottom: insets.bottom + Spacing['3xl'] }]}>
      <View style={styles.topRow}>
        <CloseButton onPress={close} label="Close" />
      </View>
      <ThemedText variant="largeTitle" accessibilityRole="header">
        {title}
      </ThemedText>
      <ThemedText variant="footnote" color="tertiary" style={styles.dateline}>
        {dateline}
      </ThemedText>
      <ThemedText variant="body" color="secondary" style={styles.intro}>
        {intro}
      </ThemedText>
      {sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <ThemedText variant="title3" accessibilityRole="header">
            {section.heading}
          </ThemedText>
          {section.paragraphs.map((paragraph) => (
            <ThemedText key={paragraph} variant="body" color="secondary" style={styles.paragraph}>
              {paragraph}
            </ThemedText>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, maxWidth: 680, width: '100%', alignSelf: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.md },
  dateline: { marginTop: Spacing.xs },
  intro: { marginTop: Spacing.lg },
  section: { marginTop: Spacing['2xl'], gap: Spacing.sm },
  paragraph: { lineHeight: 24 },
});

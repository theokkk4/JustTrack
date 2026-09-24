import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { ListRow, ListSection } from '@/components/ui/ListRow';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME, REPOSITORY_URL, TAGLINE } from '@/constants/brand';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useNutritionGoals } from '@/hooks/useNutritionGoals';
import { deleteAccount, signOut } from '@/services/authService';
import type { HeightUnit, ThemePreference, WeightUnit } from '@/types';
import { showOptionSheet } from '@/utils/actionSheet';
import { getErrorMessage } from '@/utils/errors';
import { formatNumber } from '@/utils/format';
import { HEIGHT_UNIT_LABELS, WEIGHT_UNIT_LABELS } from '@/utils/units';

const APPEARANCE_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const WEIGHT_OPTIONS: readonly { value: WeightUnit; label: string }[] = [
  { value: 'lb', label: WEIGHT_UNIT_LABELS.lb },
  { value: 'kg', label: WEIGHT_UNIT_LABELS.kg },
];

const HEIGHT_OPTIONS: readonly { value: HeightUnit; label: string }[] = [
  { value: 'ft_in', label: HEIGHT_UNIT_LABELS.ft_in },
  { value: 'cm', label: HEIGHT_UNIT_LABELS.cm },
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase() || 'JT';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, preference, setPreference } = useAppTheme();
  const { weightUnit, heightUnit, updatePreferences } = usePreferences();
  const { session, profile } = useAuth();
  const goals = useNutritionGoals();
  const [deleting, setDeleting] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const email = session?.user.email ?? null;
  const displayName = profile?.displayName || email?.split('@')[0] || 'JustTrack member';
  const appearanceLabel = APPEARANCE_OPTIONS.find((option) => option.value === preference)?.label;

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your food log stays safely in your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut().catch((error) => Alert.alert('Couldn’t sign out', getErrorMessage(error))),
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account and everything in it — food logs, goals, custom foods, and weight history. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
            } catch (error) {
              setDeleting(false);
              Alert.alert('Couldn’t delete account', getErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ThemedText variant="largeTitle" accessibilityRole="header" style={styles.title}>
        Profile
      </ThemedText>

      <View style={[styles.account, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.text }]}>
          <ThemedText variant="headline" style={{ color: colors.textInverse }}>
            {initialsFor(displayName)}
          </ThemedText>
        </View>
        <View style={styles.accountText}>
          <ThemedText variant="headline" numberOfLines={1}>
            {displayName}
          </ThemedText>
          {email ? (
            <ThemedText variant="footnote" color="secondary" numberOfLines={1}>
              {email}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <ListSection title="Goals">
        <ListRow
          icon="target"
          iconBackground={colors.accent}
          title="Nutrition Goals"
          value={`${formatNumber(goals.calories)} cal`}
          onPress={() => router.push('/settings/goals')}
          isLast
        />
      </ListSection>

      <ListSection title="Units">
        <ListRow
          icon="scale"
          iconBackground={colors.fat}
          title="Weight"
          value={weightUnit}
          onPress={() =>
            showOptionSheet({
              title: 'Weight units',
              options: WEIGHT_OPTIONS,
              selected: weightUnit,
              onSelect: (value) => updatePreferences({ weightUnit: value }),
            })
          }
        />
        <ListRow
          icon="ruler"
          iconBackground={colors.carbs}
          title="Height"
          value={heightUnit === 'cm' ? 'cm' : 'ft & in'}
          onPress={() =>
            showOptionSheet({
              title: 'Height units',
              options: HEIGHT_OPTIONS,
              selected: heightUnit,
              onSelect: (value) => updatePreferences({ heightUnit: value }),
            })
          }
          isLast
        />
      </ListSection>

      <ListSection title="App">
        <ListRow
          icon="appearance"
          iconBackground={colors.protein}
          title="Appearance"
          value={appearanceLabel}
          onPress={() =>
            showOptionSheet({ title: 'Appearance', options: APPEARANCE_OPTIONS, selected: preference, onSelect: setPreference })
          }
          isLast
        />
      </ListSection>

      <ListSection title="About" footer="Free and open source. No ads, no subscriptions, no analytics.">
        <ListRow
          icon="openSource"
          iconBackground={colors.text}
          iconColor={colors.textInverse}
          title="Open Source"
          onPress={() => WebBrowser.openBrowserAsync(REPOSITORY_URL)}
        />
        <ListRow
          icon="info"
          iconBackground={colors.textSecondary}
          title="About JustTrack"
          value={`v${version}`}
          onPress={() => Alert.alert(APP_NAME, `${TAGLINE}\n\nVersion ${version}`)}
          isLast
        />
      </ListSection>

      <ListSection title="Account">
        <ListRow icon="signOut" iconBackground={colors.textSecondary} title="Sign Out" onPress={confirmSignOut} showChevron={false} />
        <ListRow
          icon="deleteAccount"
          iconBackground={colors.danger}
          title="Delete Account"
          destructive
          onPress={deleting ? undefined : confirmDelete}
          showChevron={false}
          accessory={deleting ? <ActivityIndicator color={colors.textSecondary} /> : undefined}
          isLast
        />
      </ListSection>

      <View style={styles.footer}>
        <Logo width={36} color={colors.textTertiary} />
        <ThemedText variant="caption1" color="tertiary">
          {TAGLINE}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: Spacing.lg, paddingBottom: Spacing.lg },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  accountText: { flex: 1, gap: 2 },
  footer: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing['3xl'] },
});

import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ListRow, ListSection } from '@/components/ui/ListRow';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME, REPOSITORY_URL, TAGLINE } from '@/constants/brand';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useNutritionGoals } from '@/hooks/useNutritionGoals';
import type { HeightUnit, ThemePreference, WeightUnit } from '@/types';
import { showOptionSheet } from '@/utils/actionSheet';
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

export default function ProfileScreen() {
  const { colors, preference, setPreference } = useAppTheme();
  const { weightUnit, heightUnit, updatePreferences } = usePreferences();
  const goals = useNutritionGoals();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const appearanceLabel = APPEARANCE_OPTIONS.find((option) => option.value === preference)?.label;

  return (
    <Screen>
      <View style={styles.brand}>
        <Logo width={64} />
        <ThemedText variant="title2" accessibilityRole="header" style={styles.brandName}>
          {APP_NAME}
        </ThemedText>
        <ThemedText variant="subhead" color="secondary" style={styles.centered}>
          {TAGLINE}
        </ThemedText>
      </View>

      <ListSection title="Goals">
        <ListRow
          icon="target"
          iconBackground={colors.accent}
          title="Nutrition Goals"
          value={`${formatNumber(goals.calories)} cal`}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', paddingTop: Spacing['2xl'], gap: Spacing.sm },
  brandName: { marginTop: Spacing.sm },
  centered: { textAlign: 'center' },
});

import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { CALORIE_STEP, MAX_CALORIE_TARGET } from '@/constants/onboarding';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useFinishOnboarding } from '@/hooks/useFinishOnboarding';
import { calculateMacroTargets, calculateNutritionTargets, MIN_CALORIE_TARGET } from '@/lib/nutrition/calorieTarget';
import { getErrorMessage } from '@/utils/errors';
import { formatNumber } from '@/utils/format';

export default function PlanScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { session } = useAuth();
  const { draft, updateDraft } = useOnboarding();
  const finishOnboarding = useFinishOnboarding();

  const { sex, ageYears, heightCm, weightKg, activityLevel, weightGoal } = draft;
  const recommended =
    sex && ageYears && heightCm && weightKg && activityLevel && weightGoal
      ? calculateNutritionTargets({ sex, ageYears, heightCm, weightKg }, activityLevel, weightGoal)
      : null;

  const [calories, setCalories] = useState(draft.goals?.calories ?? recommended?.calories ?? MIN_CALORIE_TARGET);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!recommended || !weightKg || !weightGoal) {
    return <Redirect href="/onboarding/profile" />;
  }

  const macros = calculateMacroTargets(calories, weightKg, weightGoal);
  const adjusted = calories !== recommended.calories;

  const adjust = (delta: number) => {
    const next = Math.min(MAX_CALORIE_TARGET, Math.max(MIN_CALORIE_TARGET, calories + delta));
    if (next === calories) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.selectionAsync();
    setCalories(next);
  };

  const handleContinue = async () => {
    const goals = { calories, ...macros };
    updateDraft({ goals });
    if (!session) {
      router.push('/onboarding/account');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await finishOnboarding(session.user.id, { goals });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (caught) {
      setError(getErrorMessage(caught));
      setSaving(false);
    }
  };

  const macroTiles = [
    { label: 'Protein', grams: macros.protein, color: colors.protein },
    { label: 'Carbs', grams: macros.carbs, color: colors.carbs },
    { label: 'Fat', grams: macros.fat, color: colors.fat },
  ];

  return (
    <OnboardingScaffold
      step={3}
      totalSteps={3}
      title="Your daily target"
      subtitle="A starting point based on your answers. You can change it anytime."
      footer={
        <>
          {error ? (
            <ThemedText variant="footnote" style={[styles.center, { color: colors.danger }]}>
              {error}
            </ThemedText>
          ) : null}
          <Button label={session ? 'Start tracking' : 'Continue'} onPress={handleContinue} loading={saving} />
        </>
      }
    >
      <Card elevated="md" style={styles.card}>
        <View style={[styles.pill, { backgroundColor: colors.accentMuted }]}>
          <ThemedText variant="caption2" style={[styles.pillText, { color: colors.accent }]}>
            ESTIMATED
          </ThemedText>
        </View>

        <View style={styles.stepper}>
          <StepButton icon="minus" label="Decrease by 50 calories" onPress={() => adjust(-CALORIE_STEP)} />
          <View style={styles.value} accessible accessibilityLabel={`${formatNumber(calories)} calories per day`}>
            <ThemedText variant="largeTitle" style={styles.tabular}>
              {formatNumber(calories)}
            </ThemedText>
            <ThemedText variant="footnote" color="secondary">
              calories per day
            </ThemedText>
          </View>
          <StepButton icon="plus" label="Increase by 50 calories" onPress={() => adjust(CALORIE_STEP)} />
        </View>

        {adjusted ? (
          <Pressable onPress={() => setCalories(recommended.calories)} accessibilityRole="button" hitSlop={8}>
            <ThemedText variant="footnote" color="secondary" style={styles.center}>
              Recommended: {formatNumber(recommended.calories)} ·{' '}
              <ThemedText variant="footnote" style={{ color: colors.accent }}>
                Reset
              </ThemedText>
            </ThemedText>
          </Pressable>
        ) : null}

        <View style={[styles.macros, { borderTopColor: colors.border }]}>
          {macroTiles.map((tile) => (
            <View key={tile.label} style={styles.macro} accessible accessibilityLabel={`${tile.label} ${tile.grams} grams`}>
              <View style={[styles.dot, { backgroundColor: tile.color }]} />
              <ThemedText variant="headline" style={styles.tabular}>
                {tile.grams}g
              </ThemedText>
              <ThemedText variant="caption1" color="secondary">
                {tile.label}
              </ThemedText>
            </View>
          ))}
        </View>
      </Card>

      <View style={[styles.note, { backgroundColor: colors.backgroundSecondary }]}>
        <AppIcon name="info" size={18} color={colors.textSecondary} />
        <ThemedText variant="footnote" color="secondary" style={styles.noteText}>
          Estimated with the Mifflin–St Jeor equation from your age, height, weight, and activity. Every body is different —
          treat this as a starting point, and check with a doctor or registered dietitian before making big changes.
        </ThemedText>
      </View>
    </OnboardingScaffold>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'minus' | 'plus'; label: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.stepButton, { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.6 : 1 }]}
    >
      <AppIcon name={icon} size={20} color={colors.text} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing['2xl'] },
  pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radii.full },
  pillText: { letterSpacing: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  stepButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  value: { alignItems: 'center', minWidth: 140 },
  tabular: { fontVariant: ['tabular-nums'] },
  center: { textAlign: 'center' },
  macros: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.lg,
  },
  macro: { alignItems: 'center', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: Spacing.xs },
  note: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radii.md },
  noteText: { flex: 1 },
});

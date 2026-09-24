import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { MAX_CALORIE_TARGET } from '@/constants/onboarding';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useNutritionGoals } from '@/hooks/useNutritionGoals';
import { ageFromBirthYear, calculateNutritionTargets, MIN_CALORIE_TARGET } from '@/lib/nutrition/calorieTarget';
import { saveNutritionGoals } from '@/services/profileService';
import type { NutritionValues } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { formatNumber } from '@/utils/format';

type Field = keyof NutritionValues;

const FIELDS: readonly { key: Field; label: string; suffix: string; max: number }[] = [
  { key: 'calories', label: 'Calories', suffix: 'cal', max: MAX_CALORIE_TARGET },
  { key: 'protein', label: 'Protein', suffix: 'g', max: 1000 },
  { key: 'carbs', label: 'Carbs', suffix: 'g', max: 2000 },
  { key: 'fat', label: 'Fat', suffix: 'g', max: 1000 },
];

function toInputs(values: NutritionValues): Record<Field, string> {
  return {
    calories: String(Math.round(values.calories)),
    protein: String(Math.round(values.protein)),
    carbs: String(Math.round(values.carbs)),
    fat: String(Math.round(values.fat)),
  };
}

export default function NutritionGoalsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { session, profile, latestWeightKg, refreshProfile } = useAuth();
  const goals = useNutritionGoals();

  const [inputs, setInputs] = useState(() => toInputs(goals));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const numbers = {
    calories: Number(inputs.calories) || 0,
    protein: Number(inputs.protein) || 0,
    carbs: Number(inputs.carbs) || 0,
    fat: Number(inputs.fat) || 0,
  };
  const macroCalories = numbers.protein * 4 + numbers.carbs * 4 + numbers.fat * 9;
  const macrosDisagree = numbers.calories > 0 && Math.abs(macroCalories - numbers.calories) > numbers.calories * 0.05;

  const canRecalculate = Boolean(
    profile?.sex && profile.birthYear && profile.heightCm && profile.activityLevel && profile.weightGoal && latestWeightKg
  );

  const recalculate = () => {
    if (!profile?.sex || !profile.birthYear || !profile.heightCm || !profile.activityLevel || !profile.weightGoal || !latestWeightKg) {
      return;
    }
    const targets = calculateNutritionTargets(
      {
        sex: profile.sex,
        ageYears: ageFromBirthYear(profile.birthYear),
        heightCm: profile.heightCm,
        weightKg: latestWeightKg,
      },
      profile.activityLevel,
      profile.weightGoal
    );
    Haptics.selectionAsync();
    setInputs(toInputs(targets));
    setErrors({});
  };

  const handleSave = async () => {
    const nextErrors: Partial<Record<Field, string>> = {};
    for (const field of FIELDS) {
      const value = Number(inputs[field.key]);
      const min = field.key === 'calories' ? MIN_CALORIE_TARGET : 0;
      if (!Number.isFinite(value) || inputs[field.key].trim() === '' || value < min || value > field.max) {
        nextErrors[field.key] = `Enter ${min}–${formatNumber(field.max)}.`;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !session) return;

    setSaving(true);
    setSaveError(null);
    try {
      await saveNutritionGoals(session.user.id, numbers);
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (caught) {
      setSaveError(getErrorMessage(caught));
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={saving} accessibilityRole="button" hitSlop={8}>
              <ThemedText variant="bodyEmphasized" style={{ color: saving ? colors.textTertiary : colors.accent }}>
                Save
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
      >
        <Card style={styles.fields}>
          {FIELDS.map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              value={inputs[field.key]}
              onChangeText={(text) => setInputs((current) => ({ ...current, [field.key]: text.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
              maxLength={5}
              suffix={field.suffix}
              error={errors[field.key]}
            />
          ))}
        </Card>

        <ThemedText variant="footnote" style={[styles.summary, { color: macrosDisagree ? colors.warning : colors.textSecondary }]}>
          Protein, carbs, and fat add up to {formatNumber(macroCalories)} cal
          {macrosDisagree ? ` — that's not quite your ${formatNumber(numbers.calories)} cal goal.` : '.'}
        </ThemedText>

        {canRecalculate ? (
          <Button label="Recalculate from my profile" variant="secondary" icon="target" onPress={recalculate} />
        ) : null}

        {saveError ? (
          <ThemedText variant="footnote" style={{ color: colors.danger }}>
            {saveError}
          </ThemedText>
        ) : null}

        <View style={[styles.note, { backgroundColor: colors.backgroundSecondary }]}>
          <AppIcon name="info" size={18} color={colors.textSecondary} />
          <ThemedText variant="footnote" color="secondary" style={styles.noteText}>
            Targets are estimates. JustTrack won&apos;t suggest going below {formatNumber(MIN_CALORIE_TARGET)} calories a day —
            talk to a doctor or registered dietitian if you think you need less.
          </ThemedText>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
  fields: { gap: Spacing.lg },
  summary: { marginHorizontal: Spacing.xs },
  note: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radii.md },
  noteText: { flex: 1 },
});

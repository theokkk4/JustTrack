import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { SEX_OPTIONS } from '@/constants/onboarding';
import { Spacing } from '@/constants/theme';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import {
  convertHeightInputs,
  convertWeightInput,
  heightInputsFor,
  parseBodyStats,
  weightInputFor,
  type BodyStatsErrors,
} from '@/lib/onboarding/bodyStats';
import type { HeightUnit, Sex, WeightUnit } from '@/types';

const HEIGHT_UNIT_OPTIONS: readonly { value: HeightUnit; label: string }[] = [
  { value: 'ft_in', label: 'ft / in' },
  { value: 'cm', label: 'cm' },
];

const WEIGHT_UNIT_OPTIONS: readonly { value: WeightUnit; label: string }[] = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
];

export default function AboutYouScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { draft, updateDraft } = useOnboarding();
  const { weightUnit, heightUnit, updatePreferences } = usePreferences();

  const [sex, setSex] = useState<Sex | null>(draft.sex);
  const [age, setAge] = useState(draft.ageYears ? String(draft.ageYears) : '');
  const [height, setHeight] = useState(draft.heightCm ? heightInputsFor(draft.heightCm) : { feet: '', inches: '', cm: '' });
  const [weight, setWeight] = useState(draft.weightKg ? weightInputFor(draft.weightKg, weightUnit) : '');
  const [errors, setErrors] = useState<BodyStatsErrors & { sex?: string }>({});

  const changeHeightUnit = (next: HeightUnit) => {
    setHeight((current) => convertHeightInputs(current, next));
    updatePreferences({ heightUnit: next });
  };

  const changeWeightUnit = (next: WeightUnit) => {
    setWeight((current) => convertWeightInput(current, weightUnit, next));
    updatePreferences({ weightUnit: next });
  };

  const handleContinue = () => {
    const result = parseBodyStats({ age, ...height, weight }, { weightUnit, heightUnit });
    const nextErrors = { ...(result.ok ? {} : result.errors), ...(sex ? {} : { sex: 'Choose one — it only affects the calorie estimate.' }) };
    setErrors(nextErrors);
    if (!result.ok || !sex) return;

    updateDraft({ sex, ...result.value, goals: null });
    router.push('/onboarding/activity');
  };

  return (
    <OnboardingScaffold
      step={1}
      totalSteps={3}
      title="About you"
      subtitle="We use this to estimate how much energy your body needs each day."
      footer={<Button label="Continue" onPress={handleContinue} />}
    >
      <View style={styles.group}>
        <ThemedText variant="subheadEmphasized">Sex</ThemedText>
        <SegmentedControl options={SEX_OPTIONS} value={sex} onChange={setSex} accessibilityLabel="Sex" />
        <ThemedText variant="footnote" style={{ color: errors.sex ? colors.danger : colors.textSecondary }}>
          {errors.sex ?? 'Only used for the calorie estimate.'}
        </ThemedText>
      </View>

      <TextField
        label="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        maxLength={3}
        suffix="years"
        placeholder="20"
        error={errors.age}
      />

      <View style={styles.group}>
        <View style={styles.unitRow}>
          <ThemedText variant="subheadEmphasized">Height</ThemedText>
          <View style={styles.unitToggle}>
            <SegmentedControl options={HEIGHT_UNIT_OPTIONS} value={heightUnit} onChange={changeHeightUnit} accessibilityLabel="Height unit" />
          </View>
        </View>
        {heightUnit === 'cm' ? (
          <TextField
            label="Centimeters"
            value={height.cm}
            onChangeText={(cm) => setHeight((current) => ({ ...current, cm }))}
            keyboardType="number-pad"
            maxLength={3}
            suffix="cm"
            placeholder="175"
            error={errors.height}
          />
        ) : (
          <View style={styles.row}>
            <TextField
              label="Feet"
              value={height.feet}
              onChangeText={(feet) => setHeight((current) => ({ ...current, feet }))}
              keyboardType="number-pad"
              maxLength={1}
              suffix="ft"
              placeholder="5"
              error={errors.height}
            />
            <TextField
              label="Inches"
              value={height.inches}
              onChangeText={(inches) => setHeight((current) => ({ ...current, inches }))}
              keyboardType="number-pad"
              maxLength={2}
              suffix="in"
              placeholder="10"
            />
          </View>
        )}
      </View>

      <View style={styles.group}>
        <View style={styles.unitRow}>
          <ThemedText variant="subheadEmphasized">Weight</ThemedText>
          <View style={styles.unitToggle}>
            <SegmentedControl options={WEIGHT_UNIT_OPTIONS} value={weightUnit} onChange={changeWeightUnit} accessibilityLabel="Weight unit" />
          </View>
        </View>
        <TextField
          label="Current weight"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          maxLength={5}
          suffix={weightUnit}
          placeholder={weightUnit === 'kg' ? '70' : '155'}
          error={errors.weight}
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.sm },
  unitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unitToggle: { width: 132 },
  row: { flexDirection: 'row', gap: Spacing.md },
});

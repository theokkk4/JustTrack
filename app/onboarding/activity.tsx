import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { Button } from '@/components/ui/Button';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { ThemedText } from '@/components/ui/ThemedText';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from '@/constants/onboarding';
import { Spacing } from '@/constants/theme';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { ActivityLevel, WeightGoal } from '@/types';

export default function ActivityScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();
  const [activity, setActivity] = useState<ActivityLevel | null>(draft.activityLevel);
  const [goal, setGoal] = useState<WeightGoal | null>(draft.weightGoal);

  const handleContinue = () => {
    if (!activity || !goal) return;
    updateDraft({ activityLevel: activity, weightGoal: goal, goals: null });
    router.push('/onboarding/goals');
  };

  return (
    <OnboardingScaffold
      step={2}
      totalSteps={3}
      title="Your routine"
      subtitle="How active are you in a typical week?"
      footer={<Button label="Continue" onPress={handleContinue} disabled={!activity || !goal} />}
    >
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Activity level">
        {ACTIVITY_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            description={option.description}
            selected={activity === option.value}
            onPress={() => setActivity(option.value)}
          />
        ))}
      </View>

      <ThemedText variant="title3" accessibilityRole="header" style={styles.goalTitle}>
        What&apos;s your goal?
      </ThemedText>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Goal">
        {GOAL_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            description={option.description}
            selected={goal === option.value}
            onPress={() => setGoal(option.value)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  options: { gap: Spacing.sm },
  goalTitle: { marginTop: Spacing.md },
});

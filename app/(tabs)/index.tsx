import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { FatSecretAttribution } from '@/components/food/FatSecretAttribution';
import { CalorieRing } from '@/components/nutrition/CalorieRing';
import { MacroBar } from '@/components/nutrition/MacroBar';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListRow, ListSection } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useDayLog } from '@/hooks/useDayLog';
import { useNutritionGoals } from '@/hooks/useNutritionGoals';
import { formatLongDate, getGreeting } from '@/utils/date';
import { formatCalories } from '@/utils/format';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { now, today } = useCurrentTime();
  const day = useDayLog(today);
  const { sections, totals } = day;
  const goals = useNutritionGoals();

  return (
    <Screen onRefresh={() => void day.refresh()} refreshing={day.refreshing && day.status !== 'loading'}>
      <View style={styles.header}>
        <ThemedText variant="footnote" color="secondary" style={styles.eyebrow}>
          {formatLongDate(today).toUpperCase()}
        </ThemedText>
        <ThemedText variant="largeTitle" accessibilityRole="header">
          {getGreeting(now)}
        </ThemedText>
      </View>

      <Card elevated="md" style={styles.summary}>
        <CalorieRing consumed={totals.calories} goal={goals.calories} />
        <View style={styles.macros}>
          <MacroBar
            label="Protein"
            consumed={totals.protein}
            goal={goals.protein}
            color={colors.protein}
            trackColor={colors.proteinMuted}
          />
          <MacroBar label="Carbs" consumed={totals.carbs} goal={goals.carbs} color={colors.carbs} trackColor={colors.carbsMuted} />
          <MacroBar label="Fat" consumed={totals.fat} goal={goals.fat} color={colors.fat} trackColor={colors.fatMuted} />
        </View>
      </Card>

      <ThemedText variant="title3" accessibilityRole="header" style={styles.sectionTitle}>
        Today&apos;s Meals
      </ThemedText>
      <ListSection style={styles.meals}>
        {sections.map((section, index) => (
          <ListRow
            key={section.mealType}
            icon={MEAL_TYPE_META[section.mealType].icon}
            iconBackground={colors.backgroundSecondary}
            iconColor={colors.text}
            title={MEAL_TYPE_META[section.mealType].label}
            value={formatCalories(section.totals.calories)}
            onPress={() => router.navigate('/diary')}
            isLast={index === sections.length - 1}
          />
        ))}
      </ListSection>

      {day.unresolvedCount > 0 && day.foodsError ? (
        <View style={styles.notice}>
          <Banner tone="warning" message="Some foods couldn’t load, so today’s totals may be low." actionLabel="Retry" onAction={() => void day.refresh()} />
        </View>
      ) : null}

      <View style={styles.addFood}>
        <Button label="Add Food" icon="plus" onPress={() => router.push('/food/search')} />
      </View>

      {day.hasFatSecretContent ? <FatSecretAttribution style={styles.attribution} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.xxs },
  eyebrow: { letterSpacing: 0.6 },
  summary: { paddingVertical: Spacing['2xl'], gap: Spacing['2xl'] },
  macros: { gap: Spacing.lg },
  sectionTitle: { marginTop: Spacing['3xl'], marginBottom: Spacing.md },
  meals: { marginTop: 0 },
  addFood: { marginTop: Spacing.xl },
  notice: { marginTop: Spacing.lg },
  attribution: { marginTop: Spacing.lg },
});

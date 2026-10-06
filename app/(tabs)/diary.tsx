import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { FatSecretAttribution } from '@/components/food/FatSecretAttribution';
import { MealSectionCard } from '@/components/food/MealSectionCard';
import { Banner } from '@/components/ui/Banner';
import { DateSwitcher } from '@/components/ui/DateSwitcher';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useDayLog } from '@/hooks/useDayLog';
import { useNutritionGoals } from '@/hooks/useNutritionGoals';
import { calculateRemaining } from '@/lib/nutrition/calculateNutrition';
import { formatNumber } from '@/utils/format';

export default function DiaryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { today } = useCurrentTime();
  const [selectedDate, setSelectedDate] = useState(today);
  const day = useDayLog(selectedDate);
  const goals = useNutritionGoals();
  const remaining = calculateRemaining(goals.calories, day.totals.calories);

  const stats = [
    { label: 'Eaten', value: formatNumber(day.totals.calories) },
    { label: 'Goal', value: formatNumber(goals.calories) },
    { label: remaining < 0 ? 'Over' : 'Left', value: formatNumber(Math.abs(remaining)), highlight: remaining < 0 },
  ];

  return (
    <Screen onRefresh={() => void day.refresh()} refreshing={day.refreshing && day.status !== 'loading'}>
      <ThemedText variant="largeTitle" accessibilityRole="header" style={styles.title}>
        Diary
      </ThemedText>

      <DateSwitcher date={selectedDate} today={today} onChange={setSelectedDate} />

      <View style={styles.stats} accessible accessibilityLabel={stats.map((s) => `${s.label} ${s.value} calories`).join(', ')}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <ThemedText variant="title3" style={[styles.tabular, stat.highlight ? { color: colors.warning } : undefined]}>
              {stat.value}
            </ThemedText>
            <ThemedText variant="caption1" color="secondary">
              {stat.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.sections}>
        {day.status === 'loading' ? <ActivityIndicator color={colors.textSecondary} /> : null}
        {day.error ? (
          <Banner
            tone="error"
            message={day.status === 'error' ? day.error : `Couldn’t refresh — showing what was loaded before. ${day.error}`}
            actionLabel="Retry"
            onAction={() => void day.refresh()}
          />
        ) : null}
        {day.unresolvedCount > 0 && day.foodsError ? (
          <Banner
            tone="warning"
            message={`Some foods couldn’t load, so today’s totals may be low. ${day.foodsError}`}
            actionLabel="Retry"
            onAction={() => void day.refresh()}
          />
        ) : null}

        {day.sections.map((section) => (
          <MealSectionCard
            key={section.mealType}
            section={section}
            onAddFood={() =>
              router.push({ pathname: '/food/search', params: { mealType: section.mealType, date: day.dateKey } })
            }
          />
        ))}
      </View>

      {day.hasFatSecretContent ? <FatSecretAttribution style={styles.attribution} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: Spacing.lg, paddingBottom: Spacing.lg },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.xl },
  stat: { alignItems: 'center', gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  sections: { gap: Spacing.lg },
  attribution: { marginTop: Spacing.xl },
});

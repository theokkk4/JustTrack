import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CaloriesLeft } from '@/components/home/CaloriesLeft';
import { MacroShareRow } from '@/components/home/MacroShareRow';
import { MealCard } from '@/components/home/MealCard';
import { WeekStrip } from '@/components/home/WeekStrip';
import { GradientHeader } from '@/components/layout/GradientHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { PRIVACY_LINE } from '@/constants/brand';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useLog } from '@/hooks/useLog';
import { useSettings } from '@/hooks/useSettings';
import { formatRelativeDay, isSameDay } from '@/utils/date';

function initialFor(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || 'JT';
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { today } = useCurrentTime();
  const [picked, setPicked] = useState<Date | null>(null);
  // Follow the calendar: once a new day starts, the picked day falls back to today.
  const day = picked && picked <= today ? picked : today;
  const isToday = isSameDay(day, today);
  const { sections, totals } = useLog(day);
  const settings = useSettings();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never">
      <GradientHeader>
        <View style={styles.topRow}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.22)' }]} accessible accessibilityLabel={settings.displayName ?? 'Profile'}>
            <ThemedText variant="subheadEmphasized" style={{ color: colors.onGradient }}>
              {initialFor(settings.displayName)}
            </ThemedText>
          </View>
          <ThemedText variant="headline" style={{ color: colors.onGradient }} accessibilityRole="header">
            {isToday ? 'Home' : formatRelativeDay(day, today)}
          </ThemedText>
          <View style={styles.avatar}>
            <AppIcon name="calendar" size={18} color={colors.onGradient} />
          </View>
        </View>
        <WeekStrip today={today} selected={day} onSelect={setPicked} />
        <CaloriesLeft eaten={totals.calories} goal={settings.calorieGoal} />
        <MacroShareRow totals={totals} onGradient />
      </GradientHeader>

      <View style={styles.body}>
        <View style={styles.sectionHeader}>
          <ThemedText variant="title3" accessibilityRole="header">
            Daily meals
          </ThemedText>
          {!isToday ? (
            <ThemedText variant="footnote" color="secondary" onPress={() => setPicked(null)} accessibilityRole="button">
              Back to today
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.cards}>
          {sections.map((section) => (
            <MealCard key={section.mealType} section={section} onAdd={() => router.push({ pathname: '/food/search', params: { mealType: section.mealType } })} />
          ))}
        </View>

        <ThemedText variant="caption1" color="tertiary" style={styles.footnote}>
          {PRIVACY_LINE}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['5xl'] },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  cards: { gap: Spacing.md },
  footnote: { textAlign: 'center', marginTop: Spacing['2xl'], paddingHorizontal: Spacing.lg },
});

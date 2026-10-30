import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MacroShareRow } from '@/components/home/MacroShareRow';
import { GradientHeader } from '@/components/layout/GradientHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useLog } from '@/hooks/useLog';
import { useSettings } from '@/hooks/useSettings';
import { expiresAt, describeTimeLeft } from '@/lib/log/window';
import { balanceScore, MIN_CALORIES_FOR_SCORE } from '@/lib/nutrition/balance';
import { formatNumber } from '@/utils/format';

/** The last 24 hours at a glance: balance, macros, calories by meal, and what clears next. */
export default function TodayScreen() {
  const { colors } = useAppTheme();
  const { entries, sections, totals, now } = useLog();
  const settings = useSettings();
  const balance = balanceScore(totals);
  const maxMeal = Math.max(...sections.map((section) => section.totals.calories), 1);
  const upcoming = [...entries].sort((a, b) => expiresAt(a) - expiresAt(b)).slice(0, 5);
  const progress = settings.calorieGoal > 0 ? Math.min(totals.calories / settings.calorieGoal, 1) : 0;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <GradientHeader>
        <ThemedText variant="headline" style={[styles.center, { color: colors.onGradient }]} accessibilityRole="header">
          Today
        </ThemedText>
        <View style={styles.headline}>
          <ThemedText variant="display" style={[styles.tabular, { color: colors.onGradient }]}>
            {formatNumber(totals.calories)}
          </ThemedText>
          <ThemedText variant="subhead" style={{ color: colors.onGradientMuted }}>
            of {formatNumber(settings.calorieGoal)} kcal eaten
          </ThemedText>
          <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.25)' }]} accessible accessibilityLabel={`${Math.round(progress * 100)} percent of your goal`}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.onGradient }]} />
          </View>
        </View>
        <MacroShareRow totals={totals} goals={settings.macroGoals} onGradient />
      </GradientHeader>

      <View style={styles.body}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText variant="headline">Balance</ThemedText>
            <AppIcon name="info" size={16} color={colors.textTertiary} />
          </View>
          {balance ? (
            <>
              <View style={styles.scoreRow}>
                <ThemedText variant="largeTitle" style={styles.tabular}>
                  {balance.score}
                </ThemedText>
                <ThemedText variant="subhead" color="secondary">
                  / 100
                </ThemedText>
              </View>
              <ThemedText variant="footnote" color="secondary">
                {balance.note ?? 'Protein, carbs, and fat are all inside the recommended ranges.'}
              </ThemedText>
            </>
          ) : (
            <ThemedText variant="footnote" color="secondary">
              Log at least {formatNumber(MIN_CALORIES_FOR_SCORE)} kcal to see how balanced the day is.
            </ThemedText>
          )}
          <ThemedText variant="caption1" color="tertiary">
            How close your calorie split is to the standard ranges (protein 10–35%, carbs 45–65%, fat 20–35%). A rough guide, not advice.
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <ThemedText variant="headline">Calories by meal</ThemedText>
          {sections.map((section) => (
            <View key={section.mealType} style={styles.barRow} accessible accessibilityLabel={`${MEAL_TYPE_META[section.mealType].label} ${formatNumber(section.totals.calories)} calories`}>
              <ThemedText variant="subhead" style={styles.barLabel}>
                {MEAL_TYPE_META[section.mealType].label}
              </ThemedText>
              <View style={[styles.barTrack, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={[styles.barFill, { width: `${Math.round((section.totals.calories / maxMeal) * 100)}%`, backgroundColor: colors.accent }]} />
              </View>
              <ThemedText variant="subheadEmphasized" style={[styles.tabular, styles.barValue]}>
                {formatNumber(section.totals.calories)}
              </ThemedText>
            </View>
          ))}
        </Card>

        <Card style={styles.card}>
          <ThemedText variant="headline">Clearing soon</ThemedText>
          {upcoming.length === 0 ? (
            <ThemedText variant="footnote" color="secondary">
              Nothing logged in the last 24 hours.
            </ThemedText>
          ) : (
            upcoming.map((entry) => (
              <View key={entry.id} style={styles.expiryRow}>
                <ThemedText variant="subhead" numberOfLines={1} style={styles.expiryName}>
                  {entry.foodName}
                </ThemedText>
                <ThemedText variant="footnote" color="secondary">
                  {describeTimeLeft(expiresAt(entry) - now)}
                </ThemedText>
              </View>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['5xl'] },
  center: { textAlign: 'center' },
  headline: { alignItems: 'center', paddingTop: Spacing['2xl'], gap: Spacing.xs },
  track: { width: 200, height: 6, borderRadius: Radii.full, overflow: 'hidden', marginTop: Spacing.md },
  fill: { height: '100%', borderRadius: Radii.full },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.sm },
  card: { gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  barLabel: { width: 76 },
  barTrack: { flex: 1, height: 10, borderRadius: Radii.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radii.full },
  barValue: { width: 48, textAlign: 'right' },
  expiryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: Spacing.xs },
  expiryName: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});

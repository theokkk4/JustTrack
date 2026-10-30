import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, View } from 'react-native';

import { FoodDataAttribution } from '@/components/food/FoodDataAttribution';
import { FoodSearchRow } from '@/components/food/FoodSearchRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { SearchField } from '@/components/ui/SearchField';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { matchRowToFood } from '@/lib/scan/reviewStore';
import type { FoodDetail } from '@/types';
import { defaultMealType } from '@/utils/mealTime';
import { mealTypeParam, singleParam } from '@/utils/routeParams';

type SectionKey = 'restaurants' | 'everyday' | 'packaged';

export default function FoodSearchScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ mealType?: string; pick?: string; q?: string }>();
  const { now } = useCurrentTime();
  const mealType = mealTypeParam(params.mealType) ?? defaultMealType(now);
  // In "pick" mode the search is choosing a database match for a scanned food.
  const pickRowId = singleParam(params.pick) ?? null;

  const [query, setQuery] = useState(() => singleParam(params.q) ?? '');
  // Built-in results are instant; the short debounce just spares Open Food Facts a request per keystroke.
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const search = useFoodSearch(debouncedQuery);

  const choose = (food: FoodDetail) => {
    if (pickRowId) {
      matchRowToFood(pickRowId, food);
      router.back();
      return;
    }
    router.push({ pathname: '/food/[id]', params: { id: food.id, mealType } });
  };

  const sections: { key: SectionKey; title: string; data: FoodDetail[] }[] = search.active
    ? [
        ...(search.restaurants.length > 0 || search.chainNamed ? [{ key: 'restaurants' as const, title: search.chainNamed ?? 'Restaurants', data: search.restaurants }] : []),
        { key: 'everyday' as const, title: 'Everyday foods', data: search.everyday },
        { key: 'packaged' as const, title: 'Packaged foods', data: search.packaged },
      ].sort((a, b) => (search.chainNamed ? 0 : (a.key === 'restaurants' ? 1 : 0) - (b.key === 'restaurants' ? 1 : 0)))
    : [];

  const sectionFooter = (key: SectionKey) => {
    if (key === 'restaurants') {
      return search.restaurants.length === 0 ? <Note text={`Nothing on the ${search.chainNamed} menu matches those words.`} /> : null;
    }
    if (key === 'everyday') {
      return search.everyday.length === 0 ? <Note text="No everyday foods match — try a simpler word." /> : null;
    }
    if (search.packagedStatus === 'loading') return <ActivityIndicator style={styles.inline} color={colors.textSecondary} />;
    if (search.packagedStatus === 'error') {
      return <Note text={search.packagedError ?? 'Packaged foods couldn’t load.'} actionLabel="Try again" onAction={search.retryPackaged} />;
    }
    if (search.packaged.length === 0) return <Note text="No packaged foods match." />;
    if (search.loadingMore) return <ActivityIndicator style={styles.inline} color={colors.textSecondary} />;
    return null;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: pickRowId ? 'Choose a match' : 'Add Food',
          headerLeft: pickRowId ? () => <HeaderButton label="Back" onPress={() => router.back()} /> : () => null,
          headerRight: pickRowId ? undefined : () => <HeaderButton label="Cancel" onPress={() => router.back()} />,
          headerTitleAlign: 'center',
        }}
      />

      <View style={styles.searchBar}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search foods or brands" autoFocus={!pickRowId} />
        <ThemedText variant="footnote" color="secondary" style={styles.destination}>
          {pickRowId ? 'Pick the closest match; the scanned amount is kept.' : `Adding to ${MEAL_TYPE_META[mealType].label}`}
        </ThemedText>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(food) => food.id}
        renderItem={({ item }) => <FoodSearchRow food={item} onPress={() => choose(item)} disambiguate={search.isAmbiguous(item)} />}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <ThemedText variant="footnote" color="secondary" style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </ThemedText>
          </View>
        )}
        renderSectionFooter={({ section }) => sectionFooter(section.key)}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={() => void search.loadMore()}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={<EmptyState icon="search" title="Search for a food" message="Try “chicken breast”, “banana”, or a brand like “Chobani”." />}
        ListFooterComponent={<FoodDataAttribution style={styles.attribution} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function Note({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.note}>
      <ThemedText variant="footnote" color="secondary" style={styles.noteText}>
        {text}
      </ThemedText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, gap: Spacing.sm },
  destination: { marginLeft: Spacing.xs },
  list: { flexGrow: 1, paddingBottom: Spacing['3xl'] },
  sectionHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xs },
  sectionTitle: { letterSpacing: 0.5 },
  inline: { marginVertical: Spacing.lg },
  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  noteText: { flex: 1 },
  attribution: { marginTop: Spacing.lg },
});

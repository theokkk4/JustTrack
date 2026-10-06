import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { FatSecretAttribution } from '@/components/food/FatSecretAttribution';
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
import { MIN_QUERY_LENGTH, useFoodSearch } from '@/hooks/useFoodSearch';
import { formatRelativeDay, parseDateKey, toDateKey } from '@/utils/date';
import { defaultMealType } from '@/utils/mealTime';
import { dateKeyParam, mealTypeParam } from '@/utils/routeParams';

export default function FoodSearchScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ mealType?: string; date?: string }>();
  const { now, today } = useCurrentTime();
  const mealType = mealTypeParam(params.mealType) ?? defaultMealType(now);
  const dateKey = dateKeyParam(params.date) ?? toDateKey(today);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const search = useFoodSearch(debouncedQuery);
  const typing = query.trim() !== debouncedQuery && query.trim().length >= MIN_QUERY_LENGTH;

  const destination = `${MEAL_TYPE_META[mealType].label} · ${formatRelativeDay(parseDateKey(dateKey) ?? today, today)}`;

  let empty: React.ReactNode = null;
  if (search.status === 'idle') {
    empty = <EmptyState icon="search" title="Search for a food" message="Try “greek yogurt”, “banana”, or a brand name." />;
  } else if (search.status === 'error') {
    empty = (
      <EmptyState
        icon="wifiOff"
        title="Search isn’t working right now"
        message={search.error ?? 'Please try again.'}
        actionLabel="Try Again"
        onAction={search.retry}
      />
    );
  } else if (search.status === 'ready' && !typing) {
    empty = (
      <EmptyState icon="search" title={`No results for “${debouncedQuery}”`} message="Check the spelling, or try a more general name." />
    );
  } else {
    empty = <ActivityIndicator style={styles.spinner} color={colors.textSecondary} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerLeft: () => <HeaderButton label="Cancel" onPress={() => router.back()} /> }} />

      <View style={styles.searchBar}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search foods"
          autoFocus
          loading={typing || (search.status === 'loading' && search.results.length > 0)}
        />
        <ThemedText variant="footnote" color="secondary" style={styles.destination}>
          Adding to {destination}
        </ThemedText>
      </View>

      <FlatList
        data={search.results}
        keyExtractor={(result) => result.id}
        renderItem={({ item }) => (
          <FoodSearchRow
            result={item}
            onPress={() => router.push({ pathname: '/food/[id]', params: { id: item.id, mealType, date: dateKey } })}
          />
        )}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={() => void search.loadMore()}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={empty}
        ListFooterComponent={
          <View style={styles.footer}>
            {search.loadingMore ? <ActivityIndicator color={colors.textSecondary} /> : null}
            <FatSecretAttribution />
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, gap: Spacing.sm },
  destination: { marginLeft: Spacing.xs },
  list: { flexGrow: 1 },
  spinner: { marginTop: Spacing['3xl'] },
  footer: { paddingVertical: Spacing.lg, gap: Spacing.md },
});

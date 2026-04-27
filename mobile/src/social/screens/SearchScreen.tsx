// src/social/screens/SearchScreen.tsx
/**
 * SearchScreen — user discovery.
 * -----------------------------------------------------------------------------
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ Search bar  ┊  Cancel (when focused/active)  │
 *   ├──────────────────────────────────────────────┤
 *   │ Type chips                  Sort ▾            │
 *   ├──────────────────────────────────────────────┤
 *   │ Empty:    Recent searches                    │
 *   │           Trending hashtags                  │
 *   │ Active:   Profile result rows                │
 *   └──────────────────────────────────────────────┘
 *
 * Each result row uses SearchResultCard (FollowButton + ChatActionButton).
 * Connection statuses are bulk-fetched in one round-trip.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import SearchBar from '../components/search/SearchBar';
import SearchFilters from '../components/search/SearchFilters';
import SearchHistoryList from '../components/search/SearchHistoryList';
import TrendingHashtags from '../components/search/TrendingHashtags';
import SearchResultCard from '../components/shared/SearchResultCard';
import { EmptyState, SectionHeader } from '../components/shared';

import {
  useAddSearchHistory,
  useClearSearchHistory,
  useRemoveSearchHistoryEntry,
  useSearchHashtags,
  useSearchHistory,
  useSocialSearch,
} from '../hooks/useSocialSearch';
import {
  useBulkConnectionStatus,
  useToggleFollow,
} from '../hooks/useFollow';
import { useSocialTheme } from '../theme/socialTheme';
import type { SearchSortBy, SearchType } from '../types';

type AnyNav = NativeStackNavigationProp<any>;

const SearchScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const styles = makeStyles(theme);

  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('all');
  const [sortBy, setSortBy] = useState<SearchSortBy>('relevance');
  const [focused, setFocused] = useState(false);

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;
  const hasTypeFilter = type !== 'all';
  const isSearching = hasQuery || hasTypeFilter;

  // ── Data ─────────────────────────────────────────────────────────────
  const searchQ = useSocialSearch({ q: query, type, sortBy, limit: 20 });
  const historyQ = useSearchHistory();
  const trendingQ = useSearchHashtags('', true);

  const addHistoryM = useAddSearchHistory();
  const removeHistoryM = useRemoveSearchHistoryEntry();
  const clearHistoryM = useClearSearchHistory();
  const { mutate: toggleFollow } = useToggleFollow();

  const results = searchQ.data?.results ?? [];
  const history = historyQ.data ?? [];
  const trending = (trendingQ.data?.hashtags ?? trendingQ.data ?? []) as Array<{
    name: string;
    postsCount?: number;
    trending?: boolean;
  }>;

  // ── Bulk connection status for the visible page of results ───────────
  const userIds = useMemo(() => results.map((r) => r._id), [results]);
  const { statusMap } = useBulkConnectionStatus(userIds);

  // ── Persist successful searches in history ───────────────────────────
  useEffect(() => {
    if (!searchQ.isSuccess || !hasQuery) return;
    if (!results.length) return;
    addHistoryM.mutate({ query: trimmed, type });
    // Persist only when the *committed* query result changes, not on every
    // unrelated state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQ.isSuccess, results.length, trimmed]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const goToProfile = useCallback(
    (userId: string, userName?: string) =>
      navigation.navigate('PublicProfile', { userId, userName }),
    [navigation],
  );

  const handleFollow = useCallback(
    (targetId: string) => {
      toggleFollow({ targetId, targetType: 'User', source: 'search' });
    },
    [toggleFollow],
  );

  const handleHashtagPress = useCallback((name: string) => {
    setQuery(`#${name}`);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <View style={styles.headerWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onCancel={() => {
            setFocused(false);
            setQuery('');
          }}
          showCancel={focused || query.length > 0}
        />
      </View>

      <SearchFilters
        type={type}
        sortBy={sortBy}
        onTypeChange={setType}
        onSortChange={setSortBy}
      />

      {isSearching ? (
        <FlashList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <SearchResultCard
              result={item}
              status={statusMap[item._id] ?? 'none'}
              onPress={() => goToProfile(item._id, item.name)}
              onFollowPress={() => handleFollow(item._id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={searchQ.isRefetching}
              onRefresh={() => searchQ.refetch()}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            searchQ.isLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : (
              <EmptyState
                icon="search-outline"
                title={
                  hasQuery
                    ? `No matches for "${trimmed}"`
                    : 'Refine your filters'
                }
                subtitle={
                  hasQuery
                    ? 'Try a different name, role, or keyword.'
                    : 'Start typing or pick a different category.'
                }
              />
            )
          }
          ListFooterComponent={
            searchQ.isFetching && results.length > 0 ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      ) : (
        <FlashList
          data={[] as never[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              <SearchHistoryList
                history={history}
                onPressEntry={(e) => {
                  setQuery(e.query);
                  if (e.type) setType(e.type as SearchType);
                }}
                onRemoveEntry={(e) => removeHistoryM.mutate(e.query)}
                onClearAll={() => clearHistoryM.mutate()}
              />

              {trending.length > 0 ? (
                <View>
                  <SectionHeader title="Trending" />
                  <TrendingHashtags
                    hashtags={trending}
                    onPress={handleHashtagPress}
                  />
                </View>
              ) : null}

              {history.length === 0 && trending.length === 0 ? (
                <EmptyState
                  icon="search-outline"
                  title="Discover people"
                  subtitle="Search by name, role, or skill to find people to follow and message."
                />
              ) : null}
            </View>
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (_theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    headerWrap: { paddingHorizontal: 12, paddingVertical: 10 },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
  });

export default SearchScreen;